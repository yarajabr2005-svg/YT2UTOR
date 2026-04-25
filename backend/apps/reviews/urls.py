from django.urls import path
from .views import CreateReviewView, TutorReviewsView

urlpatterns = [
    path("reviews/", CreateReviewView.as_view(), name="create-review"),
    path("tutors/<uuid:tutor_id>/reviews/", TutorReviewsView.as_view(), name="tutor-reviews"),
]
