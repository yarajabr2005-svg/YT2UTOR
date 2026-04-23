from django.urls import path
from .views import (
    TutorAvailabilityListView,
    CreateAvailabilityView,
    AvailabilityDetailView,
)

urlpatterns = [
    path(
        "tutors/<uuid:tutor_id>/availability/",
        TutorAvailabilityListView.as_view(),
        name="tutor-availability-list",
    ),
    path(
        "tutors/availability/",
        CreateAvailabilityView.as_view(),
        name="tutor-availability-create",
    ),
    path(
        "tutors/availability/<int:slot_id>/",
        AvailabilityDetailView.as_view(),
        name="tutor-availability-detail",
    ),
]