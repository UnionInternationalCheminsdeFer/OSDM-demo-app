<template>
  <div class="flex-1 flex flex-col min-w-64">
    <div v-if="isDifferentReferenceDay()" class="flex gap-4 p-1 px-2 rounded w-fit bg-osdm-warn my-4">
      <sbb-icon name="circle-information-small"></sbb-icon>
      <span>{{ formatStartDay() }}</span>
    </div>
    <sbb-pearl-chain-time :legs="calculateSBBLegsFromTrip(trip as components['schemas']['Trip'])"
      :arrival-time="trip.endTime" :departure-time="trip.startTime"></sbb-pearl-chain-time>
    <div class="flex justify-between">
      <span>{{
        trip.transfers == 0
          ? 'direct'
          : trip.transfers == 0
            ? `${trip.transfers} transfers`
            : `${trip.transfers} transfers`
      }}</span>
      <span class="text-osdm-error">{{ nextDayText(trip.endTime) }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { useTripsStore, DateReferenceType } from '@/stores/trips'
import type { components } from '@/schemas/schema'
import type { PtRideLeg } from '@sbb-esta/lyne-elements-experimental/core/timetable.js'
import { SbbPearlChainTimeElement as SbbPearlChainTime } from '@sbb-esta/lyne-elements-experimental/pearl-chain-time'

export default {
  props: {
    trip: {
      type: Object,
      required: true,
    },
  },
  components: {
    SbbPearlChainTime,
  },
  methods: {
    calculateSBBLegsFromTrip(trip: components['schemas']['Trip']) {
      const sbbLegs: PtRideLeg[] = trip.legs
        .map((tripLeg): PtRideLeg | undefined => {
          if (tripLeg.timedLeg) {
            return {
              __typename: 'PTRideLeg',
              id: tripLeg.id,
              arrival: {
                time: tripLeg.timedLeg.end.serviceArrival.timetabledTime,
                quayChanged: false,
              },
              departure: {
                time: tripLeg.timedLeg.start.serviceDeparture.timetabledTime,
                quayChanged: false,
              },
              serviceJourney: {
                quayTypeName: 'platform',
                quayTypeShortName: 'Pl.',
                serviceAlteration: {
                  cancelled: false,
                  delayText: 'string',
                  reachable: true,
                  unplannedStopPointsText: '',
                  partiallyCancelled: false,
                  redirected: false,
                  redirectedText: '',
                },
                id: tripLeg.id,
                notices: [],
                serviceProducts: [],
                situations: [],
                stopPoints: tripLeg.timedLeg.intermediates?.map(() => ({
                  //stop: components['schemas']['Intermediate']
                  stopStatus: 'PLANNED',
                })) ?? [{}],
              },
              start: {
                id: tripLeg.timedLeg.start.stopPlaceRef.stopPlaceRef,
                name: tripLeg.timedLeg.start.stopPlaceName,
              },
              end: {
                id: tripLeg.timedLeg.end.stopPlaceRef.stopPlaceRef,
                name: tripLeg.timedLeg.end.stopPlaceName,
              },
              countryCodes: {},
              duration: tripLeg.timedLeg.duration ? parseInt(tripLeg.timedLeg.duration) : undefined,
            }
          }
        })
        .filter((leg) => !!leg) as PtRideLeg[]

      return sbbLegs
    },
    isDifferentReferenceDay() {
      const tripStore = useTripsStore();
      if (tripStore.search) {
        if (tripStore.search.dateReferenceType == DateReferenceType.DEPARTURE) {
          return new Date(this.trip.startTime).getDate() !== tripStore.search.date.getDate()
        } else {
          return new Date(this.trip.endTime).getDate() !== tripStore.search.date.getDate()
        }
      }
    },
    nextDayText(dateString: string) {
      const dateA = new Date(dateString)
      dateA.setHours(0, 0, 0, 0)
      const dateB = new Date(this.trip.startTime)
      dateB.setHours(0, 0, 0, 0)
      const dayOffset = Math.floor((Number(dateA) - Number(dateB)) / 1000 / 60 / 60 / 24)
      if (dayOffset > 0) {
        // See: https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
        const arrivalDate = new Date(dateString).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        return `+ ${dayOffset} (${arrivalDate})`
      }
    },
    formatStartDay() {
      const tripStore = useTripsStore();
      if (tripStore.search) {
        if (tripStore.search.dateReferenceType == DateReferenceType.DEPARTURE) {
          return `Departing on ${new Date(this.trip.startTime).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`
        }
      }
      return `Arriving on ${new Date(this.trip.endTime).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`
    }
  },
}
</script>
