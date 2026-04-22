<template>
  <sbb-card>
    <div class="flex flex-col items-center gap-2">
      <div class="self-start mb-4">
        <p
          v-for="(description, index) in getOfferPartSummary(getMainOfferParts(offer))"
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

      <hr
        class="w-full my-4"
        v-if="offer.ancillaryOfferParts && offer.ancillaryOfferParts.length > 0"
      />
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

              <div class="border-t pt-3 flex flex-col gap-2">
                <div class="text-sm font-medium">Accommodation preference</div>
                <div class="flex flex-col md:flex-row gap-2">
                  <select
                    v-model="section.accommodationDraftKey"
                    class="border rounded px-2 py-1 text-sm flex-1"
                  >
                    <option value="">-- select --</option>
                    <option
                      v-for="accommodation in accommodations"
                      :key="`${section.reservationId}-${accommodation.value}`"
                      :value="accommodation.value"
                    >
                      {{ accommodation.label }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="border rounded px-3 py-1 text-sm"
                    @click="addAccommodation(section)"
                  >
                    Add
                  </button>
                </div>

                <div
                  v-if="section.selectedAccommodationKeys.length > 0"
                  class="flex flex-col gap-2"
                >
                  <div
                    v-for="accommodationKey in section.selectedAccommodationKeys"
                    :key="`${section.reservationId}-selected-${accommodationKey}`"
                    class="flex items-center justify-between gap-2 border rounded px-2 py-1 text-sm"
                  >
                    <span>{{ getAccommodationLabel(accommodationKey) }}</span>
                    <button
                      type="button"
                      class="border rounded px-2 py-0.5 text-xs"
                      @click="removeAccommodation(section, accommodationKey)"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div class="text-xs opacity-70">
                  Applies to the selected passengers above. You can add more than one preference.
                </div>
              </div>
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
  type SelectedAccommodation,
  type SelectedPlaceSelection,
} from '@/stores/offers'
import { SbbCardElement as SbbCard } from '@sbb-esta/lyne-elements/card'
import { SbbChipElement as SbbChip } from '@sbb-esta/lyne-elements/chip'

type PassengerPlace = {
  coachNumber: string
  placeNumber: string
}

type AccommodationOption = {
  value: string
  label: string
}

type SeatSection = {
  reservationId: string
  allowedPassengerRefs: string[]
  selectedPassengerRefs: string[]
  adjacent: boolean
  referencePlace: PassengerPlace
  placesByPassenger: Record<string, PassengerPlace>
  accommodationDraftKey: string
  selectedAccommodationKeys: string[]
}

const ACCOMMODATION_VALUES = [
  'PLACE_OR_COMPARTMENT_LOCATION|MIDDLE_BED',
  'PLACE_OR_COMPARTMENT_LOCATION|UPPER_BED',
  'PLACE_OR_COMPARTMENT_LOCATION|UPPER_DECK',
  'COMPARTMENT_TYPE|CARRE',
  'COMPARTMENT_TYPE|CLUB_2',
  'COMPLETE_COMPARTMENT|COMPLETE',
  'COMPLETE_COMPARTMENT|CONFERENCE',
  'PLACE_OR_COMPARTMENT_POSITION|EASY_ACCESS',
  'PLACE_OR_COMPARTMENT_ALIGNMENT|FACE_2_FACE',
  'PLACE_OR_COMPARTMENT_POSITION|FAMILY',
  'PLACE_OR_COMPARTMENT_POSITION|SILENCE',
  'PLACE_OR_COMPARTMENT_FEATURE|INCLUDING_MEAL',
  'PLACE_OR_COMPARTMENT_FEATURE|INCLUDING_DRINK',
  'COMPARTMENT_TYPE|KIOSQUE',
  'PLACE_OR_COMPARTMENT_POSITION|NEAR_ANIMALS',
  'PLACE_OR_COMPARTMENT_POSITION|NEAR_DINING',
  'PLACE_OR_COMPARTMENT_FEATURE|PHONE',
  'PLACE_OR_COMPARTMENT_FEATURE|POWER',
  'COMPARTMENT_TYPE|SALON',
  'PLACE_OR_COMPARTMENT_ALIGNMENT|SIDE_BY_SIDE',
  'COMPARTMENT_TYPE|SOLO',
  'SPECIAL_COMPARTMENT_TYPE|WITH_ANIMALS',
  'PLACE_OR_COMPARTMENT_POSITION|WITH_SMALL_CHILDREN',
  'SPECIAL_COMPARTMENT_TYPE|WITHOUT_ANIMALS',
  'PLACE_OR_COMPARTMENT_LOCATION|MIDDLE_SEAT',
  'PLACE_OR_COMPARTMENT_LOCATION|WINDOW_SEAT',
  'COMPARTMENT_TYPE|CABIN8',
  'COMPARTMENT_TYPE|CLUB',
  'COMPARTMENT_TYPE|COMPARTMENT',
  'COMPARTMENT_TYPE|DOUBLE_WC',
  'COMPARTMENT_TYPE|DOUBLE_SWC',
  'PLACE_OR_COMPARTMENT_POSITION|NEAR_BICYCLE_AREA',
  'COMPARTMENT_TYPE|OPEN_SPACE',
  'COMPARTMENT_TYPE|PANORAMA',
  'SPECIAL_COMPARTMENT_TYPE|PRAM',
  'COMPARTMENT_TYPE|SLEEPERETTE',
  'PLACE_OR_COMPARTMENT_FEATURE|TABLE',
  'PLACE_OR_COMPARTMENT_FEATURE|VIDEO',
  'SPECIAL_COMPARTMENT_TYPE|WHEELCHAIR_AND_SEAT',
  'SPECIAL_COMPARTMENT_TYPE|WHEELCHAIR_NO_SEAT',
  'PLACE_OR_COMPARTMENT_ALIGNMENT|CONNECTING_DOOR',
  'GENDER|LADIES',
  'GENDER|MEN',
  'GENDER|MIXED',
] as const

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
    accommodations(): AccommodationOption[] {
      return ACCOMMODATION_VALUES.map((value) => ({
        value,
        label: value
          .split('|')
          .map((part) => this.normalizeText(part))
          .join(' / '),
      }))
    },
  },
  created() {
    this.seatSections = this.getInitialSeatSections()
  },
  setup() {
    return { displayPrice, extractPriceFromOffer }
  },
  methods: {
    getMainOfferParts(offer) {
      if (offer.admissionOfferParts?.length) {
        return offer.admissionOfferParts
      }
      if (offer.reservationOfferParts?.length) {
        return offer.reservationOfferParts
      }
      return []
    },
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

          const placesByPassenger = allowedPassengerRefs.reduce(
            (acc: Record<string, PassengerPlace>, passengerRef: string) => {
              acc[passengerRef] = { coachNumber: '', placeNumber: '' }
              return acc
            },
            {},
          )

          return {
            reservationId,
            allowedPassengerRefs,
            selectedPassengerRefs: [],
            adjacent: false,
            referencePlace: { coachNumber: '', placeNumber: '' },
            placesByPassenger,
            accommodationDraftKey: '',
            selectedAccommodationKeys: [],
          }
        })
        .filter((section: SeatSection) => !!section.reservationId)
    },
    getFilledPlaceSelections(): SelectedPlaceSelection[] {
      if (!this.enableSeatSelection) {
        return []
      }

      return this.seatSections
        .map((section): SelectedPlaceSelection | null => {
          const selectedPassengerRefs = section.selectedPassengerRefs.filter((passengerRef) =>
            section.allowedPassengerRefs.includes(passengerRef),
          )

          const accommodations: SelectedAccommodation[] = selectedPassengerRefs.length > 0
            ? section.selectedAccommodationKeys
                .map((accommodationKey) => {
                  const [accommodationType, accommodationSubType] = accommodationKey.split('|')
                  if (!accommodationType || !accommodationSubType) {
                    return null
                  }
                  return {
                    passengerRefs: [...selectedPassengerRefs],
                    accommodationType,
                    accommodationSubType,
                  }
                })
                .filter((accommodation): accommodation is SelectedAccommodation => !!accommodation)
            : []

          if (section.adjacent) {
            const coachNumber = section.referencePlace.coachNumber?.trim() ?? ''
            const placeNumber = section.referencePlace.placeNumber?.trim() ?? ''

            if (!coachNumber || !placeNumber || selectedPassengerRefs.length === 0) {
              if (accommodations.length === 0) {
                return null
              }

              return {
                reservationId: section.reservationId,
                accommodations,
              }
            }

            return {
              reservationId: section.reservationId,
              passengerRefs: selectedPassengerRefs,
              referencePlace: {
                coachNumber,
                placeNumber,
              },
              ...(accommodations.length > 0 ? { accommodations } : {}),
            }
          }

          const places = selectedPassengerRefs
            .map((passengerRef) => {
              const place = section.placesByPassenger[passengerRef]
              const coachNumber = place?.coachNumber?.trim() ?? ''
              const placeNumber = place?.placeNumber?.trim() ?? ''
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

          if (places.length === 0 && accommodations.length === 0) {
            return null
          }

          return {
            reservationId: section.reservationId,
            ...(places.length > 0 ? { places } : {}),
            ...(accommodations.length > 0 ? { accommodations } : {}),
          }
        })
        .filter((placeSelection): placeSelection is SelectedPlaceSelection => !!placeSelection)
    },
    handleSelect() {
      const filledPlaceSelections = this.getFilledPlaceSelections()

      useOfferStore().setSelectOfferAncillariesAndPlaces(
        this.offer as components['schemas']['Offer'],
        this.addedAncillaries,
        filledPlaceSelections,
      )

      this.$router.push({
        name: 'booking',
        query: {
          offerId: this.offer.offerId,
          ancillariesIds: JSON.stringify(this.addedAncillaries.map((aa) => aa.id)),
          placeSelections: JSON.stringify(filledPlaceSelections),
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
    togglePassenger(section: SeatSection, passengerRef: string, checked: boolean) {
      if (checked) {
        if (!section.selectedPassengerRefs.includes(passengerRef)) {
          section.selectedPassengerRefs = [...section.selectedPassengerRefs, passengerRef]
        }
        return
      }

      section.selectedPassengerRefs = section.selectedPassengerRefs.filter((ref) => ref !== passengerRef)
    },
    updatePassengerPlace(
      section: SeatSection,
      passengerRef: string,
      field: 'coachNumber' | 'placeNumber',
      value: string,
    ) {
      section.placesByPassenger = {
        ...section.placesByPassenger,
        [passengerRef]: {
          ...(section.placesByPassenger[passengerRef] ?? { coachNumber: '', placeNumber: '' }),
          [field]: value,
        },
      }
    },
    addAccommodation(section: SeatSection) {
      const value = section.accommodationDraftKey?.trim?.() ?? ''
      if (!value) {
        return
      }
      if (!section.selectedAccommodationKeys.includes(value)) {
        section.selectedAccommodationKeys = [...section.selectedAccommodationKeys, value]
      }
      section.accommodationDraftKey = ''
    },
    removeAccommodation(section: SeatSection, accommodationKey: string) {
      section.selectedAccommodationKeys = section.selectedAccommodationKeys.filter(
        (value) => value !== accommodationKey,
      )
    },
    getAccommodationLabel(accommodationKey: string) {
      const option = this.accommodations.find((item) => item.value === accommodationKey)
      return option?.label ?? accommodationKey
    },
    getPassengerLabel(passengerRef: string, fallbackIndex: number) {
      const passenger = this.passengers.find((item: any) => `${item?.externalRef}` === `${passengerRef}`)
      if (!passenger) {
        return `Passenger ${fallbackIndex + 1}`
      }

      const fullName = [passenger?.detail?.firstName, passenger?.detail?.lastName]
        .filter(Boolean)
        .join(' ')

      return fullName
        ? `Passenger ${fallbackIndex + 1} - ${fullName}`
        : `Passenger ${fallbackIndex + 1}`
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
