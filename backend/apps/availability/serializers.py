from rest_framework import serializers
from .models import Availability

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = [
            "id",
            "week_start_date",
            "day_of_week",
            "start_time",
            "end_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CreateAvailabilitySlotSerializer(serializers.Serializer):
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()

    def validate(self, data):
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class CreateAvailabilityRequestSerializer(serializers.Serializer):
    week_start_date = serializers.DateField()
    slots = CreateAvailabilitySlotSerializer(many=True)

    def validate_slots(self, value):
        if not value:
            raise serializers.ValidationError("At least one slot is required.")
        return value


class UpdateAvailabilityRequestSerializer(serializers.Serializer):
    week_start_date = serializers.DateField(required=False)
    day_of_week = serializers.IntegerField(min_value=0, max_value=6, required=False)
    start_time = serializers.TimeField(required=False)
    end_time = serializers.TimeField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field must be provided.")
        return attrs
    