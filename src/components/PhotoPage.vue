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

          <!-- Web Mentions Section -->
          <div class="webmentions">
            <h3>Web Mentions</h3>
            <div v-if="webMentions.length">
              <ul>
                <li v-for="mention in webMentions" :key="mention.url">
                  <div class="mention">
                    <img
                      v-if="mention.author.photo"
                      :src="mention.author.photo"
                      alt=""
                      class="mention-author-photo"
                    />
                    <div>
                      <a :href="mention.author.url" target="_blank">{{ mention.author.name }}</a>
                      <p v-if="mention.content && mention.content.text">
                        {{ mention.content.text }}
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div v-else>
              <p>No web mentions yet.</p>
            </div>
          </div>

          <!-- Rest of your content -->
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
      webMentions: [],
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
  },
  mounted() {
    this.fetchPhotoData();
    this.fetchWebMentions();
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

      // Get image URLs based on size
      const smallImage = filenames.find(
        (filename) => filename.includes('-small') && filename.endsWith('.jpeg')
      );
      const mediumImage = filenames.find(
        (filename) => filename.includes('-medium') && filename.endsWith('.jpeg')
      );
      const largeImage = filenames.find(
        (filename) => filename.includes('-large') && filename.endsWith('.jpeg')
      );

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
    fetchWebMentions() {
      const baseUrl = 'https://jws.pictures';
      const pageUrl = `${baseUrl}/${this.year}/${this.id}`;
      const apiUrl = `https://webmention.io/api/mentions.jf2?target=${encodeURIComponent(
        pageUrl
      )}`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          this.webMentions = data.children || [];
        })
        .catch((error) => {
          console.error('Error fetching web mentions:', error);
        });
    },
    goBackToYear() {
      this.$router.push(`/${this.year}`);
    },
    goBackToAll() {
      this.$router.push(`/`);
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

/* Adjust map container to be 50% of its original size */
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
  min-height: 150px; /* Ensure a minimum height */
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

/* Styles for the web mentions */
.webmentions {
  margin-top: 1rem;
}

.webmentions h3 {
  margin-bottom: 0.5rem;
}

.webmentions ul {
  list-style: none;
  padding: 0;
}

.webmentions .mention {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.mention-author-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.mention a {
  font-weight: bold;
  margin-right: 0.5rem;
}

.mention p {
  margin: 0;
}
</style>