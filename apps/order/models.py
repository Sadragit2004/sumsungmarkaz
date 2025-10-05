from django.db import models
from django.utils import timezone
import uuid
from apps.product.models import Product, Brand
from apps.user.models import CustomUser

# ========================
# مدل سفارش (Order)
# ========================
class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "در حال بررسی"),
        ("processing", "در حال پردازش"),
        ("shipped", "ارسال شده"),
        ("delivered", "تحویل داده شده"),
        ("canceled", "لغو شده"),
    )

    customer = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name="orders", verbose_name="مشتری"
    )
    orderCode = models.UUIDField(
        unique=True, default=uuid.uuid4,
        verbose_name="کد سفارش", editable=False
    )
    registerDate = models.DateTimeField(default=timezone.now, verbose_name="تاریخ ثبت")
    updateDate = models.DateTimeField(auto_now=True, verbose_name="تاریخ ویرایش")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default="pending", verbose_name="وضعیت سفارش"
    )
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")

    discount = models.PositiveIntegerField(default=0, verbose_name="تخفیف روی فاکتور")
    isFinally = models.BooleanField(default=False, verbose_name="نهایی شده")

    def __str__(self):
        return f"سفارش {self.customer} - {self.orderCode}"

    def getTotalPrice(self):
        """محاسبه جمع کل سفارش قبل از تخفیف"""
        return sum(item.price * item.qty for item in self.details.all())

    def getFinalPrice(self):
        """محاسبه مبلغ نهایی با تخفیف"""
        total = self.getTotalPrice()
        if self.discount:
            total -= (total * self.discount) // 100
        return total

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"


# ========================
# مدل جزئیات سفارش (OrderDetail)
# ========================
class OrderDetail(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE,
        related_name="details", verbose_name="سفارش"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE,
        related_name="orderItems", verbose_name="محصول"
    )
    brand = models.ForeignKey(
        Brand, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="برند"
    )

    qty = models.PositiveIntegerField(default=1, verbose_name="تعداد")
    price = models.PositiveIntegerField(verbose_name="قیمت واحد در فاکتور")

    # ویژگی‌های انتخابی (به صورت رشته ذخیره می‌کنیم)
    selectedOptions = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="ویژگی‌های انتخابی"
    )

    def __str__(self):
        return f"{self.order.orderCode} - {self.product.title} × {self.qty}"

    def getTotalPrice(self):
        return self.qty * self.price

    class Meta:
        verbose_name = "جزئیات سفارش"
        verbose_name_plural = "جزئیات سفارش‌ها"
