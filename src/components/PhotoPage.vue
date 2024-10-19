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

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useHead } from '@vueuse/head';
  import { useRoute, useRouter } from 'vue-router';
  import Card from 'primevue/card';
  import Button from 'primevue/button';
  import { LMap, LTileLayer, LMarker } from 'vue3-leaflet';

  const route = useRoute();
  const router = useRouter();

  const year = route.params.year;
  const id = route.params.id;

  const baseUrl = 'https://jws.pictures'; // Your site's base URL

  const photo = ref(null);
  const selectedImage = ref('');
  const cardStyle = {
    width: 'calc(100vw - 2rem)',
    margin: '1rem',
  };

  const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const latitude = ref(null);
  const longitude = ref(null);
  const imageLinks = ref({
    small: { jpeg: '', webp: '' },
    medium: { jpeg: '', webp: '' },
    large: { jpeg: '', webp: '' },
  });

  const formattedDate = computed(() => {
    return photo.value && photo.value.exif && photo.value.exif.DateTime
      ? new Date(photo.value.exif.DateTime).toLocaleDateString()
      : '';
  });

  const hasGPSData = computed(() => {
    return latitude.value !== null && longitude.value !== null;
  });

  const sizes = ['small', 'medium', 'large'];

  onMounted(() => {
    fetchPhotoData();
  });

  function fetchPhotoData() {
    fetch(`/photos/${year}/${id}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        photo.value = data;
        prepareImageSources();
        extractGPSData();
        updateMetaTags(); // Update meta tags after fetching data
      })
      .catch((error) => {
        console.error('Error fetching photo data:', error);
      });
  }

  function prepareImageSources() {
    if (!photo.value || !photo.value.filenames) {
      console.log('No photo or filenames data available:', photo.value);
      return;
    }

    const filenames = photo.value.filenames.filename;

    // Initialize imageLinks
    imageLinks.value = {
      small: { jpeg: '', webp: '' },
      medium: { jpeg: '', webp: '' },
      large: { jpeg: '', webp: '' },
    };

    // Loop through filenames to populate imageLinks
    filenames.forEach((filename) => {
      if (filename.includes('-small')) {
        if (filename.endsWith('.jpeg')) {
          imageLinks.value.small.jpeg = filename;
        } else if (filename.endsWith('.webp')) {
          imageLinks.value.small.webp = filename;
        }
      } else if (filename.includes('-medium')) {
        if (filename.endsWith('.jpeg')) {
          imageLinks.value.medium.jpeg = filename;
        } else if (filename.endsWith('.webp')) {
          imageLinks.value.medium.webp = filename;
        }
      } else if (filename.includes('-large')) {
        if (filename.endsWith('.jpeg')) {
          imageLinks.value.large.jpeg = filename;
        } else if (filename.endsWith('.webp')) {
          imageLinks.value.large.webp = filename;
        }
      }
    });

    // Get image URLs based on size for responsive image selection
    const smallImage = imageLinks.value.small.jpeg;
    const mediumImage = imageLinks.value.medium.jpeg;
    const largeImage = imageLinks.value.large.jpeg;

    // Use responsive image selection
    selectedImage.value = getResponsiveImage({
      smallImage,
      mediumImage,
      largeImage,
    });
  }

  function getResponsiveImage({ smallImage, mediumImage, largeImage }) {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 600) {
      return smallImage || mediumImage || largeImage;
    } else if (screenWidth <= 1000) {
      return mediumImage || largeImage || smallImage;
    } else {
      return largeImage || mediumImage || smallImage;
    }
  }

  function extractGPSData() {
    if (
      photo.value &&
      photo.value.exif &&
      photo.value.exif.GPSLocation &&
      photo.value.exif.GPSLocation.Latitude &&
      photo.value.exif.GPSLocation.Longitude
    ) {
      latitude.value = parseFloat(photo.value.exif.GPSLocation.Latitude);
      longitude.value = parseFloat(photo.value.exif.GPSLocation.Longitude);
    } else {
      latitude.value = null;
      longitude.value = null;
    }
  }

  function goBackToYear() {
    router.push(`/${year}`);
  }

  function goBackToAll() {
    router.push(`/`);
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // Function to update meta tags using useHead
  function updateMetaTags() {
    console.log("XX");
    console.log(photo.value);
    if (photo.value) {
      console.log("YY");
      const imageUrl = baseUrl + imageLinks.value.small.jpeg;
      const currentUrl = baseUrl + route.fullPath;
      console.log(image.URL);
      console.log(currentURL);

      useHead({
        title: `${photo.value.description} | JWS Pictures`,
        meta: [
          {
            name: 'description',
            content: photo.value.description,
          },
          {
            property: 'og:title',
            content: photo.value.description,
          },
          {
            property: 'og:description',
            content: photo.value.location,
          },
          {
            property: 'og:image',
            content: imageUrl,
          },
          {
            property: 'og:url',
            content: currentUrl,
          },
          {
            property: 'og:type',
            content: 'article',
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            content: photo.value.description,
          },
          {
            name: 'twitter:description',
            content: photo.value.location,
          },
          {
            name: 'twitter:image',
            content: imageUrl,
          },
        ],
      });
    }
  }
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