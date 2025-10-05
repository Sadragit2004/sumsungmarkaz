from django.urls import path
from . import views

app_name = 'order'

urlpatterns = [
    # URLهای سبد خرید
    path('cart/summary/', views.cart_summary, name='cart_summary'),
    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/update/', views.update_cart_quantity, name='update_cart_quantity'),
    path('cart/clear/', views.clear_cart, name='clear_cart'),
    path('cart/count/', views.get_cart_count, name='get_cart_count'),
    path('createOrder/',views.CreateOrderView.as_view(),name='createOrder'),
    path('cart/', views.cart_page, name='cart_page'),


]