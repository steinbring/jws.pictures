<template>
  <div>
    <h1>Photos from {{ year }}</h1>
    <ul>
      <li v-for="photo in photos" :key="photo.ID">
        <router-link :to="`/${year}/${photo.ID}`">
          {{ photo.description }} ({{ photo.location }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['year'],
  data() {
    return {
      photos: []
    };
  },
  mounted() {
    fetch(`/photos/${this.year}.json`)
      .then((response) => response.json())
      .then((data) => {
        this.photos = data;
      });
  }
};
</script>