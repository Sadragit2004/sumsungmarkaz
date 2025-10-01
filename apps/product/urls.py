from django.urls import path
from . import views

app_name = "product"

urlpatterns = [
    path("categories/group/", views.category_group_view, name="category_group"),
    path('product/recently',views.latest_products_view,name='recently'),
    path('product/brands',views.top_brands_view,name='brands'),


]
