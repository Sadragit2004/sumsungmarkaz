from django.contrib import admin
from .models import Author, Category, Tag, BlogPost

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'user')
    search_fields = ('display_name', 'user__username', 'user__email')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {"slug": ("name",)}

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'status', 'publish_at', 'views')
    list_filter = ('status', 'category', 'tags', 'is_featured', 'author')
    search_fields = ('title', 'excerpt', 'content', 'seo_title', 'seo_description')
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ('author',)
    filter_horizontal = ('tags',)
    readonly_fields = ('views', 'created_at', 'updated_at')
