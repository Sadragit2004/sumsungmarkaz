from django.shortcuts import render
from django.db.models import Count
from .models import Category,Brand

def category_group_view(request):
    # همه دسته‌بندی‌ها همراه با شمارش محصولات
    categories = (
        Category.objects.annotate(product_count=Count("products"))
        .filter(isActive=True)
        .order_by("-product_count")  # بیشترین محصول اول
    )

    return render(request, "product_app/group.html", {"categories": categories})


from django.db.models import Count, Case, When, F, Avg, FloatField
from .models import Product, Comment, LikeOrUnlike

def latest_products_view(request):
    """
    Fetches the 20 latest products with their calculated ratings and available colors.
    """
    # Use Prefetch to optimize database queries for related data
    products = Product.objects.filter(isActive=True).order_by('-createAt')[:20]

    product_list = []
    for product in products:

        likes_count = LikeOrUnlike.objects.filter(product=product, like=True).count()
        unlikes_count = LikeOrUnlike.objects.filter(product=product, unlike=True).count()
        total_votes = likes_count + unlikes_count

        comments = Comment.objects.filter(product=product, isActive=True)
        comments_count = comments.count()


        if total_votes > 0:
            rating = 4 + (likes_count - unlikes_count) / (total_votes * 10)
            rating = max(3.5, min(rating, 5.0)) # Clamp between 3.5 and 5.0
        else:
            rating = 4.0
        colors = product.features_value.filter(feature__title='رنگ').values_list('value', flat=True)

        product_data = {
            'product': product,
            'image_url': product.image.url if product.image else '',
            'short_title': product.title,
            'brand': product.brand.title,
            'price': product.price,
            'colors': colors,
            'rating': round(rating, 1),
            'comments_count': comments_count,
        }
        product_list.append(product_data)

    context = {
        'products': product_list,
    }
    return render(request, 'product_app/recently_product.html', context)






def top_brands_view(request):
    """
    Fetches top brands sorted by the number of active products.
    """
    brands = Brand.objects.filter(isActive=True).annotate(
        product_count=Count('products')
    ).order_by('-product_count')[:10]  # Get the top 10 brands

    context = {
        'brands': brands,
    }
    return render(request, 'product_app/brands.html', context)