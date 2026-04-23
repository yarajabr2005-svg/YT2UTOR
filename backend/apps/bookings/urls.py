from django.urls import path

from apps.bookings.views import (
    BookingView,
    BookingConfirmView,
    BookingRejectView,
    BookingCancelView,
    BookingCompleteView,
)

urlpatterns = [
    path("bookings/", BookingView.as_view(), name="booking-list-create"),
    path("bookings/<uuid:booking_id>/confirm/", BookingConfirmView.as_view(), name="booking-confirm"),
    path("bookings/<uuid:booking_id>/reject/", BookingRejectView.as_view(), name="booking-reject"),
    path("bookings/<uuid:booking_id>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
    path("bookings/<uuid:booking_id>/complete/", BookingCompleteView.as_view(), name="booking-complete"),
]
