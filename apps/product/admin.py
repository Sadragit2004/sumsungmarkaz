from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q, Prefetch
import jdatetime

from .models import (
    Brand, Category, Product, ProductGallery, Feature, FeatureValue,
    ProductFeature, Comment, LikeOrUnlike
)

# ========================
# فیلترهای سفارشی
# ========================
class PriceLevelFilter(admin.SimpleListFilter):
    title = "بازه قیمتی"
    parameter_name = "price_level"

    def lookups(self, request, model_admin):
        return (
            ("low", "کمتر از 500K"),
            ("mid", "500K تا 2M"),
            ("high", "بیشتر از 2M"),
        )

    def queryset(self, request, queryset):
        if self.value() == "low":
            return queryset.filter(price__lt=500_000)
        if self.value() == "mid":
            return queryset.filter(price__gte=500_000, price__lte=2_000_000)
        if self.value() == "high":
            return queryset.filter(price__gt=2_000_000)
        return queryset


# ========================
# اینلاین‌ها
# ========================
class ProductGalleryInline(admin.TabularInline):
    model = ProductGallery
    extra = 1
    fields = ("preview", "image", "alt")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj and obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:8px" />', obj.image.url)
        return "—"
    preview.short_description = "پیش‌نمایش"


class ProductFeatureInline(admin.TabularInline):
    model = ProductFeature
    extra = 1
    autocomplete_fields = ("feature", "filterValue")
    fields = ("feature", "value", "filterValue")


# ========================
# Brand Admin
# ========================
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("title", "isActive", "products_count", "createAt")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("isActive", ("createAt", admin.DateFieldListFilter))

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_products_count=Count("products", distinct=True))

    def products_count(self, obj):
        return obj._products_count
    products_count.short_description = "تعداد محصولات"
    products_count.admin_order_field = "_products_count"


# ========================
# Category Admin
# ========================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("title", "parent", "isActive", "products_count")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("isActive", "parent")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_products_count=Count("products", distinct=True))

    def products_count(self, obj):
        return obj._products_count
    products_count.short_description = "تعداد محصولات"
    products_count.admin_order_field = "_products_count"


# ========================
# Feature Admin
# ========================
@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ("title", "isActive", "categories_count", "values_count")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("categories",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _categories_count=Count("categories", distinct=True),
            _values_count=Count("feature_values", distinct=True),
        )

    def categories_count(self, obj):
        return obj._categories_count
    categories_count.short_description = "تعداد دسته‌بندی‌ها"

    def values_count(self, obj):
        return obj._values_count
    values_count.short_description = "تعداد مقادیر"


# ========================
# FeatureValue Admin
# ========================
@admin.register(FeatureValue)
class FeatureValueAdmin(admin.ModelAdmin):
    list_display = ("value", "feature")
    search_fields = ("value", "feature__title")
    list_filter = ("feature",)
    autocomplete_fields = ("feature",)


# ========================
# Product Admin
# ========================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "thumb", "title", "brand", "price_fmt", "isActive",
        "categories_short", "features_count", "gallery_count", "createAt"
    )
    list_editable = ("isActive",)
    search_fields = ("title", "slug", "description")
    list_filter = (
        "isActive", "brand", "categories", PriceLevelFilter,
        ("createAt", admin.DateFieldListFilter),
    )
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("categories",)
    readonly_fields = ("thumb_large", "createAt", "updateAt")
    inlines = (ProductGalleryInline, ProductFeatureInline)
    ordering = ("-createAt",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _gallery_count=Count("gallery", distinct=True),
            _features_count=Count("features_value", distinct=True),
        ).select_related("brand").prefetch_related("categories")

    def price_fmt(self, obj):
        return f"{obj.price:,} تومان" if obj.price else "—"
    price_fmt.short_description = "قیمت"

    def thumb(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:50px;width:50px;object-fit:cover;border-radius:8px" />', obj.image.url)
        return "—"
    thumb.short_description = "تصویر"

    def thumb_large(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:200px;border-radius:12px" />', obj.image.url)
        return "—"
    thumb_large.short_description = "پیش‌نمایش بزرگ"

    def categories_short(self, obj):
        names = [c.title for c in obj.categories.all()[:3]]
        more = obj.categories.count() - len(names)
        if more > 0:
            names.append(f"+{more}")
        return "، ".join(names) if names else "—"
    categories_short.short_description = "دسته‌بندی‌ها"

    def gallery_count(self, obj):
        return obj._gallery_count
    gallery_count.short_description = "تعداد تصاویر"

    def features_count(self, obj):
        return obj._features_count
    features_count.short_description = "تعداد ویژگی‌ها"


# ========================
# ProductGallery Admin
# ========================
@admin.register(ProductGallery)
class ProductGalleryAdmin(admin.ModelAdmin):
    list_display = ("preview", "product", "alt")
    search_fields = ("product__title", "alt")
    autocomplete_fields = ("product",)

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:50px;border-radius:8px" />', obj.image.url)
        return "—"
    preview.short_description = "پیش‌نمایش"


# ========================
# ProductFeature Admin
# ========================
@admin.register(ProductFeature)
class ProductFeatureAdmin(admin.ModelAdmin):
    list_display = ("product", "feature", "value", "filterValue")
    search_fields = ("product__title", "feature__title", "value")
    autocomplete_fields = ("product", "feature", "filterValue")
    list_filter = ("feature",)


# ========================
# Comment Admin
# ========================
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "text_short", "parent_short", "get_jalali_date", "isActive")
    list_editable = ("isActive",)
    search_fields = ("user__username", "product__title", "text")
    list_filter = ("isActive", "product", ("created_at", admin.DateFieldListFilter))
    autocomplete_fields = ("user", "product", "parent")

    def text_short(self, obj):
        return (obj.text[:40] + "...") if len(obj.text) > 40 else obj.text
    text_short.short_description = "متن"

    def parent_short(self, obj):
        return f"#{obj.parent.id}" if obj.parent else "—"
    parent_short.short_description = "والد"

    def get_jalali_date(self, obj):
        return jdatetime.datetime.fromgregorian(datetime=obj.created_at).strftime("%Y/%m/%d")
    get_jalali_date.short_description = "تاریخ ثبت"


# ========================
# LikeOrUnlike Admin
# ========================
@admin.register(LikeOrUnlike)
class LikeOrUnlikeAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "comment_short", "like", "unlike", "jalali_date")
    list_filter = ("like", "unlike", ("created_at", admin.DateFieldListFilter))
    search_fields = ("user__username", "comment__text", "product__title")
    autocomplete_fields = ("user", "comment", "product")

    def comment_short(self, obj):
        return (obj.comment.text[:30] + "...") if obj.comment and len(obj.comment.text) > 30 else obj.comment.text
    comment_short.short_description = "کامنت"

    def jalali_date(self, obj):
        return jdatetime.datetime.fromgregorian(datetime=obj.created_at).strftime("%Y/%m/%d")
    jalali_date.short_description = "تاریخ ثبت"
