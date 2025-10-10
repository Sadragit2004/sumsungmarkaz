from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import F
from ckeditor_uploader.fields import RichTextUploadingField

# نویسنده: می‌تونیم از User دیجانگو استفاده کنیم یا یک مدل Author مجزا
class Author(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='author_profile')
    display_name = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='authors/avatars/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.display_name or str(self.user)


# دسته‌بندی ساده بدون والد
class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


# تگ ساده (اختیاری اما مفید برای related posts)
class Tag(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    author = models.ForeignKey(Author, on_delete=models.SET_NULL, null=True, related_name='posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='posts')
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')

    excerpt = models.TextField(blank=True)   # اطلاعات تکمیلی کوتاه
    content = models.TextField()             # محتوای بلاگ (Markdown/HTML ذخیره میشه)
    cover_image = models.ImageField(upload_to='blog/covers/', blank=True, null=True)


    description = RichTextUploadingField(
        verbose_name="توضیحات ", config_name="special", blank=True, null=True
    )
    is_featured = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    views = models.PositiveBigIntegerField(default=0)  # شمارنده بازدید

    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=300, blank=True)
    reading_time = models.PositiveSmallIntegerField(blank=True, null=True,
                                                   help_text="Approx minutes. Optional.")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    publish_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-publish_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'publish_at']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_published(self):
        if self.status != 'published':
            return False
        if self.publish_at and self.publish_at > timezone.now():
            return False
        return True

    def increment_views(self):
        # افزایش امن با F() تا race condition کم شود
        BlogPost.objects.filter(pk=self.pk).update(views=F('views') + 1)
        # هم‌زمان شئ جاری را آپدیت می‌کنیم تا بعد از فراخوانی view مقدار درست در instance باشد
        self.refresh_from_db(fields=['views'])
