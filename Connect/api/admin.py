from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, SavedStar, Post, Like, Comment, AstronomicalEvent

admin.site.register(User, UserAdmin)
admin.site.register(UserProfile)
admin.site.register(SavedStar)
admin.site.register(Post)
admin.site.register(Like)
admin.site.register(Comment)


@admin.register(AstronomicalEvent)
class AstronomicalEventAdmin(admin.ModelAdmin):
    list_display = ('name', 'event_date', 'is_active', 'target_star_catalog_id')
    list_filter = ('is_active',)
    list_editable = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('event_date',)
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'event_date', 'is_active'),
        }),
        ('3D Scene Target (optional)', {
            'description': 'Enter the exact star Name from the catalog to fly the camera there when Explore is clicked.',
            'fields': ('target_star_catalog_id',),
        }),
    )
