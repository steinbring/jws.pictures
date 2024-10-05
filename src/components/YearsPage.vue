<template>
  <div>
    <!-- Breadcrumb Component -->
    <Breadcrumb :home="home" :model="items" class="breadcrumb" />

    <div class="card-container">
      <div v-for="year in years" :key="year" class="card-wrapper">
        <router-link :to="`/${year}`" class="card-link">
          <Card class="year-card">
            <div class="year-content">
              <h2>{{ year }}</h2>
            </div>
          </Card>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
  import Card from 'primevue/card';
  import Breadcrumb from 'primevue/breadcrumb';

  export default {
    name: 'YearsPage',
    components: {
      Card,
      Breadcrumb,
    },
    data() {
      return {
        years: [2024, 2023, 2022],
        home: { icon: 'pi pi-home', to: '/' },
        items: [{ label: 'Years' }],
      };
    },
  };
</script>

<style scoped>
  .breadcrumb {
    margin-bottom: 2rem;
  }

  .card-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .card-wrapper {
    width: 400px;
  }

  .card-link {
    text-decoration: none;
    color: inherit;
  }

  .year-card {
    width: 100%;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .year-content {
    text-align: center;
  }

  .year-content h2 {
    font-size: 3rem;
    margin: 0;
  }

  /* Remove default padding from Card */
  .year-card .p-card-body {
    padding: 0;
  }
</style>
