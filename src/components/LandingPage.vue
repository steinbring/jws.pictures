<template>
  <div>
    <h1>All Photos</h1>
    <ul>
      <li v-for="photo in photos" :key="photo.ID">
        <router-link :to="`/${new Date(photo.exif.DateTime).getFullYear()}/${photo.ID}`">
          {{ photo.description }} ({{ photo.location }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      photos: []
    };
  },
  mounted() {
    fetch('/photos/all.json')
      .then((response) => response.json())
      .then((data) => {
        this.photos = data;
      });
  }
};
</script>