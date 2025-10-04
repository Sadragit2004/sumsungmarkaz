from django.urls import path
from . import views

app_name = "product"

urlpatterns = [
    path("categories/group/", views.category_group_view, name="category_group"),
    path('product/recently',views.latest_products_view,name='recently'),
    path('product/brands',views.top_brands_view,name='brands'),
 # جزئیات محصول
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product_detail'),

    # ثبت نظر برای محصول
    path('<slug:product_slug>/comment/', views.add_comment, name='add_comment'),

    # لایک/دیسلایک نظر
    path('comment/<int:comment_id>/like/', views.like_unlike_comment, name='like_unlike_comment'),

    # دریافت نظرات با صفحه‌بندی (AJAX)
    path('<slug:product_slug>/comments/', views.get_comments_ajax, name='get_comments_ajax'),


    #-------------- shop -----------------------
    path('category/<slug:slug>/',views.show_by_filter,name='shop'),
    path('category/group/filter/',views.get_products_filter,name='category_filter_group'),
    path('category/brand/filter/',views.top_brands_view_category,name='category_filter_brand'),
    path('category/feature/filter/<slug:slug>/',views.get_feature_filter,name='category_filter_feature'),

]


