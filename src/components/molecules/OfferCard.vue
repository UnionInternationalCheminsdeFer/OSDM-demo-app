<template>
  <sbb-card>
    <div class="flex flex-col items-center gap-2">
      <div class="self-start mb-4">
        <p
          v-for="(description, index) in getOfferPartSummary(offer.admissionOfferParts)"
          :key="`desc-offer-${offer.id}-${index}`"
          class="text-lg font-bold"
        >
          {{ description }} {{ getAccommodationTypeText(offer) }}
        </p>
      </div>
      <div class="flex gap-2 justify-between w-full overflow-auto py-2">
        <sbb-chip size="s" color="Granite">
          <div class="flex items-center">
            <sbb-icon name="tickets-class-small"></sbb-icon>
            {{ normalizeClassText(offer.offerSummary.overallTravelClass) }}
          </div>
        </sbb-chip>
        <sbb-chip size="s" color="Milk">
          <div class="flex items-center">
            <sbb-icon name="hand-heart-small"></sbb-icon>
            {{ normalizeText(offer.offerSummary.overallServiceClass.name) }}
          </div>
        </sbb-chip>
        <sbb-chip size="s" color="Milk">
          <div class="flex items-center">
            <sbb-icon name="arrows-circle-small"></sbb-icon>
            {{ normalizeText(offer.offerSummary.overallFlexibility) }}
          </div>
        </sbb-chip>
      </div>

      <hr class="w-full my-4" v-if="offer.ancillaryOfferParts && offer.ancillaryOfferParts.length > 0" />
      <div
        v-for="ancillaryOffer in offer.ancillaryOfferParts"
        :key="`desc-${ancillaryOffer.id}`"
        class="flex justify-between w-full items-center"
      >
        <button
          :class="addedAncillaries.includes(ancillaryOffer) ? 'btn' : 'btn btn-unselected'"
          @click="() => handleTogglAncillary(ancillaryOffer)"
        >
          <span v-if="addedAncillaries.includes(ancillaryOffer)">-</span>
          <span v-else>+</span>
        </button>
        <span>{{ displayPrice(ancillaryOffer.price) }}</span>
        <p>{{ getOfferPartSummary([ancillaryOffer]).join(' ') }}</p>
      </div>

      <template v-if="seatSections.length > 0 && passengers.length > 0">
        <hr class="w-full my-4" />
        <div class="w-full flex flex-col gap-4">
          <label class="flex items-center gap-2 font-medium">
            <input v-model="enableSeatSelection" type="checkbox" />
            <span>Seat selection</span>
          </label>

          <template v-if="enableSeatSelection">
            <div
              v-for="(section, reservationIndex) in seatSections"
              :key="`seat-selection-${section.reservationId}`"
              class="w-full border rounded p-3 flex flex-col gap-3"
            >
              <div class="font-medium">
                Reservation {{ reservationIndex + 1 }}
                <span class="text-xs opacity-70">({{ section.reservationId }})</span>
              </div>

              <label class="flex items-center gap-2 text-sm">
                <input v-model="section.adjacent" type="checkbox" />
                <span>Adjacent seats</span>
              </label>

              <div class="flex flex-col gap-2">
                <div class="text-sm font-medium">Passengers</div>
                <label
                  v-for="(passengerRef, idx) in section.allowedPassengerRefs"
                  :key="`allowed-passenger-${section.reservationId}-${passengerRef}`"
                  class="flex items-center gap-2 text-sm"
                >
                  <input
                    :checked="section.selectedPassengerRefs.includes(passengerRef)"
                    type="checkbox"
                    @change="togglePassenger(section, passengerRef, $event.target.checked)"
                  />
                  <span>{{ getPassengerLabel(passengerRef, idx) }}</span>
                </label>
              </div>

              <template v-if="section.adjacent">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                  <label class="flex flex-col text-sm gap-1">
                    <span>Coach</span>
                    <input
                      v-model="section.referencePlace.coachNumber"
                      class="border rounded px-2 py-1"
                      placeholder="2"
                    />
                  </label>
                  <label class="flex flex-col text-sm gap-1">
                    <span>Seat</span>
                    <input
                      v-model="section.referencePlace.placeNumber"
                      class="border rounded px-2 py-1"
                      placeholder="17"
                    />
                  </label>
                </div>
              </template>

              <template v-else>
                <div
                  v-for="(passengerRef, idx) in section.selectedPassengerRefs"
                  :key="`place-${section.reservationId}-${passengerRef}`"
                  class="grid grid-cols-1 md:grid-cols-3 gap-2 items-end"
                >
                  <div class="text-sm">{{ getPassengerLabel(passengerRef, idx) }}</div>
                  <label class="flex flex-col text-sm gap-1">
                    <span>Coach</span>
                    <input
                      :value="section.placesByPassenger[passengerRef]?.coachNumber ?? ''"
                      class="border rounded px-2 py-1"
                      placeholder="2"
                      @input="updatePassengerPlace(section, passengerRef, 'coachNumber', $event.target.value)"
                    />
                  </label>
                  <label class="flex flex-col text-sm gap-1">
                    <span>Seat</span>
                    <input
                      :value="section.placesByPassenger[passengerRef]?.placeNumber ?? ''"
                      class="border rounded px-2 py-1"
                      placeholder="17"
                      @input="updatePassengerPlace(section, passengerRef, 'placeNumber', $event.target.value)"
                    />
                  </label>
                </div>
              </template>
            </div>
          </template>
        </div>
      </template>

      <hr class="w-full my-4" />
      <div class="w-full flex justify-end gap-14 items-center">
        <span class="text-lg font-bold">{{
          displayPrice(
            extractPriceFromOffer(offer as components['schemas']['Offer']),
            addedAncillaries.map((aa) => aa.price),
          )
        }}</span>
        <sbb-button icon-name="chevron-right-small" @click="handleSelect"></sbb-button>
      </div>
    </div>
  </sbb-card>
</template>

<script lang="ts">
import { displayPrice, extractPriceFromOffer } from '@/helpers/price'
import type { components } from '@/schemas/schema'
import { usePassengerStore } from '@/stores/passengers'
import {
  useOfferStore,
  type SelectedPlaceSelection,
} from '@/stores/offers'
import { SbbCardElement as SbbCard } from '@sbb-esta/lyne-elements/card'
import { SbbChipElement as SbbChip } from '@sbb-esta/lyne-elements/chip'

type PassengerPlace = {
  coachNumber: string
  placeNumber: string
}

type SeatSection = {
  reservationId: string
  allowedPassengerRefs: string[]
  selectedPassengerRefs: string[]
  adjacent: boolean
  referencePlace: PassengerPlace
  placesByPassenger: Record<string, PassengerPlace>
}

export default {
  components: {
    SbbCard,
    SbbChip,
  },
  props: {
    offer: {
      type: Object,
      required: true,
    },
  },
  data(): {
    addedAncillaries: components['schemas']['AncillaryOfferPart'][]
    enableSeatSelection: boolean
    seatSections: SeatSection[]
  } {
    return {
      addedAncillaries: [],
      enableSeatSelection: false,
      seatSections: [],
    }
  },
  computed: {
    passengers() {
      return usePassengerStore().passengers
    },
  },
  created() {
    this.seatSections = this.getInitialSeatSections()
  },
  setup() {
    return { displayPrice, extractPriceFromOffer }
  },
  methods: {
    getAccommodationTypeText(offer) {
      const type = offer?.offerSummary?.overallAccommodationType
      const subType = offer?.offerSummary?.overallAccommodationSubType

      const text = [type, subType].filter(Boolean).join(' ')

      return text ? `(${text})` : ''
    },
    getInitialSeatSections(): SeatSection[] {
      const reservationOfferParts = (this.offer as any)?.reservationOfferParts ?? []

      return reservationOfferParts
        .map((reservationOfferPart: any, reservationIndex: number) => {
          const reservationId =
            reservationOfferPart?.reservationId ?? reservationOfferPart?.id ?? `${reservationIndex}`

          const allowedPassengerRefs = Array.isArray(reservationOfferPart?.passengerRefs)
            ? reservationOfferPart.passengerRefs
                .map((ref: any) => ref?.toString?.())
                .filter((ref: string | undefined) => !!ref)
            : []

          const placesByPassenger = allowedPassengerRefs.reduce((acc: Record<string, PassengerPlace>, passengerRef: string) => {
            acc[passengerRef] = { coachNumber: '', placeNumber: '' }
            return acc
          }, {})

          return {
            reservationId: reservationId?.toString?.() ?? `${reservationIndex}`,
            allowedPassengerRefs,
            selectedPassengerRefs: [],
            adjacent: false,
            referencePlace: { coachNumber: '', placeNumber: '' },
            placesByPassenger,
          }
        })
        .filter((section: SeatSection) => !!section.reservationId && section.allowedPassengerRefs.length > 0)
    },
    getPassengerByRef(passengerRef: string) {
      return this.passengers.find((passenger: any) => `${passenger.externalRef}` === `${passengerRef}`)
    },
    getPassengerLabel(passengerRef: string, index: number) {
      const passenger = this.getPassengerByRef(passengerRef)
      const detail = passenger?.detail
      if (detail?.firstName || detail?.lastName) {
        return `${detail?.firstName ?? ''} ${detail?.lastName ?? ''}`.trim()
      }
      return `Passenger ${index + 1} (${passengerRef})`
    },
    togglePassenger(section: SeatSection, passengerRef: string, checked: boolean) {
      if (checked) {
        if (!section.selectedPassengerRefs.includes(passengerRef)) {
          section.selectedPassengerRefs = [...section.selectedPassengerRefs, passengerRef]
        }
        return
      }

      section.selectedPassengerRefs = section.selectedPassengerRefs.filter((ref) => ref !== passengerRef)
      section.placesByPassenger[passengerRef] = { coachNumber: '', placeNumber: '' }
    },
    updatePassengerPlace(
      section: SeatSection,
      passengerRef: string,
      field: 'coachNumber' | 'placeNumber',
      value: string,
    ) {
      if (!section.placesByPassenger[passengerRef]) {
        section.placesByPassenger[passengerRef] = { coachNumber: '', placeNumber: '' }
      }
      section.placesByPassenger[passengerRef][field] = value
    },
    buildPlaceSelections(): SelectedPlaceSelection[] {
      if (!this.enableSeatSelection) {
        return []
      }
      return this.seatSections
        .map((section) => {
          const selectedPassengerRefs = section.selectedPassengerRefs
            .map((ref) => ref?.toString?.())
            .filter((ref: string | undefined) => !!ref)
          if (section.adjacent) {
            const coachNumber = section.referencePlace.coachNumber?.trim()
            const placeNumber = section.referencePlace.placeNumber?.trim()
            if (!coachNumber || !placeNumber) {
              return null
            }
            return {
              reservationId: section.reservationId,
              passengerRefs: selectedPassengerRefs,
              referencePlace: {
                coachNumber,
                placeNumber,
              },
            }
          }
          if (selectedPassengerRefs.length === 0) {
            return null
          }
          const places = selectedPassengerRefs
            .map((passengerRef) => {
              const place = section.placesByPassenger[passengerRef]
              const coachNumber = place?.coachNumber?.trim()
              const placeNumber = place?.placeNumber?.trim()

              if (!coachNumber || !placeNumber) {
                return null
              }

              return {
                coachNumber,
                placeNumber,
                passengerRef,
              }
            })
            .filter((place) => !!place)

          if (places.length === 0) {
            return null
          }

          return {
            reservationId: section.reservationId,
            places,
          }
        })
        .filter((selection): selection is SelectedPlaceSelection => !!selection)
    },
    handleSelect() {
      const placeSelections = this.buildPlaceSelections()
      useOfferStore().setSelectOfferAncillariesAndPlaces(
        this.offer as components['schemas']['Offer'],
        this.addedAncillaries,
        placeSelections,
      )

      this.$router.push({
        name: 'booking',
        query: {
          offerId: this.offer.offerId,
          ancillariesIds: JSON.stringify(this.addedAncillaries.map((aa) => aa.id)),
          ...this.$route.query,
        },
      })
    },
    handleTogglAncillary(ancillary: components['schemas']['AncillaryOfferPart']) {
      if (this.addedAncillaries.includes(ancillary)) {
        this.addedAncillaries = this.addedAncillaries.filter((a) => a !== ancillary)
        return
      }
      this.addedAncillaries.push(ancillary)
    },
    getOfferPartSummary(offerParts: components['schemas']['AbstractOfferPart'][]) {
      const productIds = offerParts.flatMap((op) => op.products.map((prod) => prod.productId))
      return productIds?.map(
        (ap) =>
          this.offer.products?.find((prod: components['schemas']['Product']) => prod.id == ap)
            ?.summary,
      )
    },
    normalizeText(text: string) {
      const lowercased = text.toLowerCase()
      const spacesAdded = lowercased.replace(/_/g, ' ')
      const words = spacesAdded.split(' ')
      const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1))

      return capitalized.join(' ')
    },
    normalizeClassText(text: string) {
      if (text.toLowerCase() == 'first') {
        return '1st class'
      }
      if (text.toLowerCase() == 'second') {
        return '2nd class'
      }
      return this.normalizeText(text)
    },
  },
}
</script>
