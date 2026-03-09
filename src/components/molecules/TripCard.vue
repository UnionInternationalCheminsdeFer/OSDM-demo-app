<template>
  <sbb-card>
    <div class="flex items-center gap-2 md:gap-5">
      <TripPearlChain :trip="trip" />
      <sbb-button icon-name="chevron-right-small" size="s" @click="handleSelect"></sbb-button>
      <sbb-button
              icon-name="chevron-right-small"
              size="s"
              @click="handleSelectTripSpec"
            >
              TripSpec
            </sbb-button>
    </div>
  </sbb-card>
</template>

<script lang="ts">
import { SbbCardElement as SbbCard } from '@sbb-esta/lyne-elements/card'
import TripPearlChain from '../atoms/TripPearlChain.vue'
import { convertTripToTripSpecification } from '@/helpers/conversions'

export default {
  props: {
    trip: {
      type: Object,
      required: true,
    },
  },
  components: {
    SbbCard,
    TripPearlChain,
  },
  methods: {
    handleSelect() {
      this.$router.push({
        name: 'offers',
        query: {
          trip: btoa(encodeURIComponent(JSON.stringify(this.$props.trip))),
          ...this.$route.query
        },
      })
    },
    handleSelectTripSpec() {
        const tripSpec = convertTripToTripSpecification(this.trip)

        this.$router.push({
          name: 'offers',
          query: {
            ...this.$route.query,
            tripSpec: btoa(encodeURIComponent(JSON.stringify(tripSpec))),
          },
        })
    },
  },
}
</script>
