from django.urls import path

from apps.ai.views import RecommendTutorsView

urlpatterns = [
    path("ai/recommend/", RecommendTutorsView.as_view(), name="ai-recommend"),
]
