<template>
  <div class="photo-page">
    <Card :style="cardStyle">
      <template #header>
        <img :src="selectedImage" alt="Photo" class="card-header-image" />
      </template>
      <template #title>{{ photo.description }}</template>
      <template #subtitle>{{ photo.location }}</template>
      <template #content>
        <div class="sidebar-content">
          <p><strong>📅</strong> {{ formattedDate }}</p>
          <p><strong>📷</strong> {{ photo.exif.Camera }}</p>

          <!-- Links Table -->
          <table class="image-links-table">
            <tbody>
              <tr v-for="size in sizes" :key="size">
                <td>{{ capitalize(size) }}</td>
                <td>
                  <a
                    v-if="imageLinks[size].jpeg"
                    :href="imageLinks[size].jpeg"
                    target="_blank"
                    >JPEG</a
                  >
                  <span v-else>--</span>
                </td>
                <td>
                  <a
                    v-if="imageLinks[size].webp"
                    :href="imageLinks[size].webp"
                    target="_blank"
                    >WebP</a
                  >
                  <span v-else>--</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Map Container -->
          <div class="map-container">
            <l-map
              v-if="hasGPSData"
              :zoom="13"
              :center="[latitude, longitude]"
              class="leaflet-map"
            >
              <l-tile-layer
                :url="tileLayerUrl"
                :attribution="tileLayerAttribution"
              />
              <l-marker :lat-lng="[latitude, longitude]"></l-marker>
            </l-map>
            <p v-else>No GPS data available for this photo.</p>
          </div>

        </div>
      </template>
      <template #footer>
        <div class="buttons">
          <Button
            :label="`Back to ${year} Photos`"
            icon="pi pi-arrow-left"
            @click="goBackToYear"
            class="p-button-text"
          />
          <Button
            label="Back to All Photos"
            icon="pi pi-home"
            @click="goBackToAll"
            class="p-button-text"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script>
import Card from 'primevue/card';
import Button from 'primevue/button';
import { LMap, LTileLayer, LMarker } from 'vue3-leaflet';

export default {
  components: {
    Card,
    Button,
    LMap,
    LTileLayer,
    LMarker,
  },
  props: ['year', 'id'],
  data() {
    return {
      photo: null,
      selectedImage: '',
      cardStyle: {
        width: 'calc(100vw - 2rem)',
        margin: '1rem',
      },
      tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileLayerAttribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      latitude: null,
      longitude: null,
      imageLinks: {
        small: { jpeg: '', webp: '' },
        medium: { jpeg: '', webp: '' },
        large: { jpeg: '', webp: '' },
      },
    };
  },
  computed: {
    formattedDate() {
      return this.photo && this.photo.exif && this.photo.exif.DateTime
        ? new Date(this.photo.exif.DateTime).toLocaleDateString()
        : '';
    },
    hasGPSData() {
      return this.latitude !== null && this.longitude !== null;
    },
    sizes() {
      return ['small', 'medium', 'large'];
    },
  },
  mounted() {
    this.fetchPhotoData();
  },
  methods: {
    fetchPhotoData() {
      fetch(`/photos/${this.year}/${this.id}.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Network response was not ok: ${response.status} ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          this.photo = data;
          this.prepareImageSources();
          this.extractGPSData();
        })
        .catch((error) => {
          console.error('Error fetching photo data:', error);
        });
    },
    prepareImageSources() {
      if (!this.photo || !this.photo.filenames) {
        console.log('No photo or filenames data available:', this.photo);
        return;
      }

      const filenames = this.photo.filenames.filename;

      // Initialize imageLinks
      this.imageLinks = {
        small: { jpeg: '', webp: '' },
        medium: { jpeg: '', webp: '' },
        large: { jpeg: '', webp: '' },
      };

      // Loop through filenames to populate imageLinks
      filenames.forEach((filename) => {
        if (filename.includes('-small')) {
          if (filename.endsWith('.jpeg')) {
            this.imageLinks.small.jpeg = filename;
          } else if (filename.endsWith('.webp')) {
            this.imageLinks.small.webp = filename;
          }
        } else if (filename.includes('-medium')) {
          if (filename.endsWith('.jpeg')) {
            this.imageLinks.medium.jpeg = filename;
          } else if (filename.endsWith('.webp')) {
            this.imageLinks.medium.webp = filename;
          }
        } else if (filename.includes('-large')) {
          if (filename.endsWith('.jpeg')) {
            this.imageLinks.large.jpeg = filename;
          } else if (filename.endsWith('.webp')) {
            this.imageLinks.large.webp = filename;
          }
        }
      });

      // Get image URLs based on size for responsive image selection
      const smallImage = this.imageLinks.small.jpeg;
      const mediumImage = this.imageLinks.medium.jpeg;
      const largeImage = this.imageLinks.large.jpeg;

      // Use responsive image selection
      this.selectedImage = this.getResponsiveImage({
        smallImage,
        mediumImage,
        largeImage,
      });
    },
    getResponsiveImage({ smallImage, mediumImage, largeImage }) {
      const screenWidth = window.innerWidth;

      if (screenWidth <= 600) {
        return smallImage || mediumImage || largeImage;
      } else if (screenWidth <= 1000) {
        return mediumImage || largeImage || smallImage;
      } else {
        return largeImage || mediumImage || smallImage;
      }
    },
    extractGPSData() {
      if (
        this.photo &&
        this.photo.exif &&
        this.photo.exif.GPSLocation &&
        this.photo.exif.GPSLocation.Latitude &&
        this.photo.exif.GPSLocation.Longitude
      ) {
        this.latitude = parseFloat(this.photo.exif.GPSLocation.Latitude);
        this.longitude = parseFloat(this.photo.exif.GPSLocation.Longitude);
      } else {
        this.latitude = null;
        this.longitude = null;
      }
    },
    goBackToYear() {
      this.$router.push(`/${this.year}`);
    },
    goBackToAll() {
      this.$router.push(`/`);
    },
    capitalize(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    },
  },
};
</script>

<style scoped>
.photo-page {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align items to the top to allow scrolling */
  min-height: 100vh;
  overflow-y: auto; /* Allow vertical scrolling */
}

.card-header-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.sidebar-content {
  margin-top: 1rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

/* Adjust map container */
.map-container {
  margin-top: 1rem;
  width: 100%;
  display: flex;
  justify-content: center;
}

.leaflet-map {
  width: 50%; /* 50% of parent width */
  height: auto;
}

.leaflet-map > .leaflet-container {
  width: 100%;
  height: auto;
  min-height: 450px; /* Increased height from 150px to 450px */
}

/* Allow the card to expand based on its content */
.photo-page .p-card {
  height: auto;
}

@media (min-width: 768px) and (orientation: landscape) {
  .card-header-image {
    height: 50vh;
  }
}

/* Styles for the image links table */
.image-links-table {
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
}

.image-links-table th,
.image-links-table td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: center;
}

.image-links-table th {
  background-color: #f5f5f5;
}
</style>