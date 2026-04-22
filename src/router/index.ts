import { createRouter, createWebHistory, type RouteLocationNormalizedGeneric } from 'vue-router'
import SearchView from '@/views/SearchView.vue'
import TripsView from '@/views/TripsView.vue'
import OffersView from '@/views/OffersView.vue'
import DetailsView from '@/views/DetailsView.vue'
import TicketView from '@/views/TicketView.vue'
import RefundOffersView from '@/views/RefundOffersView.vue'
import { usePassengerStore } from '@/stores/passengers'
import { DateReferenceType, TripListError, useTripsStore, type SearchCriteriaLocation } from '@/stores/trips'
import BookingView from '@/views/BookingView.vue'
import { inject } from 'vue'
import { osdmClientKey } from '@/types/symbols'
import { BookingError, useBookingStore } from '@/stores/booking'
import { OfferListError, useOfferStore } from '@/stores/offers'
import { useAuthStore } from '@/stores/auth'
import { convertDateToOsdmDateTime, convertPassengerToAnonymousPassengerSpecification, convertPlaceToRef } from '@/helpers/conversions'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/trips',
      name: 'trips',
      component: TripsView,
    },
    {
      path: '/offers',
      name: 'offers',
      component: OffersView,
    },
    {
      path: '/booking',
      name: 'booking',
      component: BookingView,
    },
    {
      path: '/refund-offers/:bookingId',
      name: 'refund-offers',
      component: RefundOffersView,
      props: true,
    },
    {
      path: '/details',
      name: 'details',
      component: DetailsView,
    },
    {
      path: '/ticket',
      name: 'ticket',
      component: TicketView,
    },
  ],
})

// ToDo: Move all async logic into views
const handleTripCollection = async (to: RouteLocationNormalizedGeneric) => {
  if (to.query.o && to.query.d && to.query.t&& to.query.v && to.query.tr) {
    const OSDM = inject(osdmClientKey)

    const origin = JSON.parse(decodeURIComponent(atob(to.query.o.toString())))
    const destination = JSON.parse(decodeURIComponent(atob(to.query.d.toString())))
    const vias = JSON.parse(decodeURIComponent(atob(to.query.v.toString())))
    const date = new Date(to.query.t.toString())
    const dateReferenceType = !!JSON.parse(to.query.tr.toString()) ? DateReferenceType.DEPARTURE : DateReferenceType.ARRIVAL

    const viasRef = vias.map((v: SearchCriteriaLocation) => ({ viaPlace: convertPlaceToRef(v) }))
    const viasRequest = viasRef.length > 0 ? viasRef : undefined
    const tripSearchCriteriaEmbeds: ['TRIPS'] = ['TRIPS']

    const request = {
      origin: convertPlaceToRef(origin),
      destination: convertPlaceToRef(destination),
      vias: viasRequest,
      departureTime: dateReferenceType == DateReferenceType.DEPARTURE ? convertDateToOsdmDateTime(date) : undefined,
      arrivalTime: dateReferenceType == DateReferenceType.ARRIVAL ? convertDateToOsdmDateTime(date) : undefined,
      embed: tripSearchCriteriaEmbeds,
    }

    useTripsStore().setLoading(true)
    const response = await OSDM?.trip.searchTrips(request)

    if (response?.data?.trips) {
      useTripsStore().setTrips(response.data.trips)
      return
    } else if (response?.data) {
      useTripsStore().setError(
        new TripListError(
          'No results',
          'No trips could be found for your search request',
          'binoculars-large',
        ),
      )
      return
    }
    useTripsStore().setError(
      new TripListError(
        'An error occurred',
        'The Server returned an error',
        'sign-exclamation-point-medium',
      ),
    )
  } else {
    // ToDo: Error handling + routing
    // e.g. GoTo Search
  }
}

const handleOfferSearch = async (to: RouteLocationNormalizedGeneric) => {
  if (to.query.trip || to.query.tripSpec) {
    const OSDM = inject(osdmClientKey)
    const passengers = usePassengerStore().passengers
    const authStore = useAuthStore()

    const baseRequest: any = {
      anonymousPassengerSpecifications: passengers.map((p) =>
        convertPassengerToAnonymousPassengerSpecification(p),
      ),
      offerSearchCriteria: {},
    }

    if (to.query.tripSpec) {
      const tripSpec = JSON.parse(decodeURIComponent(atob(to.query.tripSpec.toString())))
      baseRequest.tripSpecifications = [tripSpec]
    } else {
      const trip = JSON.parse(decodeURIComponent(atob(to.query.trip!.toString())))
      baseRequest.tripIds = [trip.id]
    }

    if (authStore.requestReservationOfferParts) {
      baseRequest.offerSearchCriteria.requestedOfferParts = ['RESERVATION']
    }

    if (Object.keys(baseRequest.offerSearchCriteria).length === 0) {
      delete baseRequest.offerSearchCriteria
    }

    useOfferStore().setLoading(true)
    const response = await OSDM?.offer.searchOffers(baseRequest)
    if (response?.data?.offers) {
      useOfferStore().setOffers(response.data.offers)
      return
    } else if (response?.data) {
      useOfferStore().setError(
        new OfferListError(
          'No results',
          'No trips could be found for your search request',
          'binoculars-large',
        ),
      )
      return
    }
    useOfferStore().setError(
      new OfferListError(
        'An error occurred',
        'The Server returned an error',
        'sign-exclamation-point-medium',
      ),
    )
  } else {
    // ToDo: Error handling + routing
    // e.g. GoTo Search
  }
}

const handleBooking = async (to: RouteLocationNormalizedGeneric) => {
  if (to.query.offerId) {
    const OSDM = inject(osdmClientKey)
    const passengers = usePassengerStore().passengers
    const offerStore = useOfferStore()

    const ancillaryIdsRaw = to.query.ancillariesIds ?? to.query.ancilleryIds
    const ancillaryIds = ancillaryIdsRaw
      ? JSON.parse(ancillaryIdsRaw.toString())
      : offerStore.selectedAncilleries.map((ancillary) => ancillary.id)

    const normalizePlaceSelections = (rawSelections: any[]): any[] => {
      if (!Array.isArray(rawSelections)) {
        return []
      }

      return rawSelections
        .map((selection: any) => {
          const reservationId = selection?.reservationId?.toString?.()
          if (!reservationId) {
            return null
          }

          const normalizedAccommodations = Array.isArray(selection?.accommodations)
            ? selection.accommodations
                .map((accommodation: any) => {
                  const passengerRefs = Array.isArray(accommodation?.passengerRefs)
                    ? accommodation.passengerRefs
                        .map((passengerRef: any) => passengerRef?.toString?.())
                        .filter((passengerRef: string | undefined) => !!passengerRef)
                    : []
                  const accommodationType = accommodation?.accommodationType?.toString?.().trim?.() ?? ''
                  const accommodationSubType = accommodation?.accommodationSubType?.toString?.().trim?.() ?? ''

                  if (passengerRefs.length === 0 || !accommodationType || !accommodationSubType) {
                    return null
                  }

                  return {
                    passengerRefs,
                    accommodationType,
                    accommodationSubType,
                  }
                })
                .filter((accommodation: any) => !!accommodation)
            : []

          if (selection?.referencePlace) {
            const coachNumber = selection.referencePlace?.coachNumber?.toString?.().trim?.() ?? ''
            const placeNumber = selection.referencePlace?.placeNumber?.toString?.().trim?.() ?? ''
            const passengerRefs = Array.isArray(selection?.passengerRefs)
              ? selection.passengerRefs
                  .map((passengerRef: any) => passengerRef?.toString?.())
                  .filter((passengerRef: string | undefined) => !!passengerRef)
              : []

            if (!coachNumber || !placeNumber || passengerRefs.length === 0) {
              return null
            }

            return {
              reservationId,
              tripLegCoverage: { tripId: '1', legId: '1' },
              passengerRefs,
              referencePlace: {
                coachNumber,
                placeNumber,
              },
              ...(normalizedAccommodations.length > 0 ? { accommodations: normalizedAccommodations } : {}),
            }
          }

          const places = Array.isArray(selection?.places)
            ? selection.places
                .map((place: any) => {
                  const coachNumber = place?.coachNumber?.toString?.().trim?.() ?? ''
                  const placeNumber = place?.placeNumber?.toString?.().trim?.() ?? ''
                  const passengerRef = place?.passengerRef?.toString?.()
                  if (!coachNumber || !placeNumber || !passengerRef) {
                    return null
                  }
                  return {
                    coachNumber,
                    placeNumber,
                    passengerRef,
                  }
                })
                .filter((place: any) => !!place)
            : []

          if (places.length === 0 && normalizedAccommodations.length === 0) {
            return null
          }

          return {
            reservationId,
            tripLegCoverage: { tripId: '1', legId: '1' },
            ...(places.length > 0 ? { places } : {}),
            ...(normalizedAccommodations.length > 0 ? { accommodations: normalizedAccommodations } : {}),
          }
        })
        .filter((selection: any) => !!selection)
    }

    const storePlaceSelections = normalizePlaceSelections(offerStore.selectedPlaceSelections as any[])
    const queryPlaceSelections = to.query.placeSelections
      ? normalizePlaceSelections(JSON.parse(to.query.placeSelections.toString()))
      : []
    const placeSelections = storePlaceSelections.length > 0 ? storePlaceSelections : queryPlaceSelections

    const offerRequest: any = {
      offerId: to.query.offerId.toString(),
      afterSaleByRetailerOnly: null,
      passengerRefs: passengers.map((p) => p.externalRef),
      optionalAncillarySelections: ancillaryIds.map((aID: string) => ({
        ancillaryId: aID,
        passengerRefs: passengers.map((p) => p.externalRef),
      })),
    }

    if (placeSelections.length > 0) {
      offerRequest.placeSelections = placeSelections
    }

    const bookingRequest = {
      offers: [offerRequest],
      passengerSpecifications: passengers,
      purchaser: {
        detail: passengers[0].detail ?? { firstName: '', lastName: '' },
      },
    }

    useBookingStore().setLoading(true)
    console.log(JSON.stringify(bookingRequest, null, 2))
    const response = await OSDM?.booking.placeBooking(bookingRequest)

    if (response?.data?.booking) {
      useBookingStore().setBooking(response.data.booking)
      usePassengerStore().definePassengers(response.data.booking.passengers)
      return
    } else if (response?.data) {
      useBookingStore().setError(
        new BookingError(
          'No results',
          'No booking could be created for the specified offer',
          'sign-exclamation-point-medium',
        ),
      )
      return
    }
    useBookingStore().setError(
      new BookingError(
        'An error occurred',
        'The Server returned an error',
        'sign-exclamation-point-medium',
      ),
    )
  } else {
    // ToDo: Error handling + routing
    // e.g. GoTo Search
  }
}

const handleFulfillment = async (to: RouteLocationNormalizedGeneric) => {
  if (to.query.bookingId) {
    const OSDM = inject(osdmClientKey)

    const passengers = usePassengerStore().passengers
    await Promise.all(passengers.map((p) => {
      if (to.query.bookingId) {
        OSDM?.booking.updatePassengerInformation(
          p,
          p.id,
          to.query.bookingId.toString(),
        )
      }
    }))

    await OSDM?.booking.fulfillBooking(
      to.query.bookingId.toString(),
    )
  } else {
    // ToDo: Error handling + routing
    // e.g. GoTo Search
  }
}

router.beforeResolve(async (to) => {
  if (to.query.o && to.query.d && to.query.t && to.query.v && to.query.tr) {
    useTripsStore().setSearchCriteria({
      origin: JSON.parse(decodeURIComponent(atob(to.query.o.toString()))),
      destination: JSON.parse(decodeURIComponent(atob(to.query.d.toString()))),
      vias: JSON.parse(decodeURIComponent(atob(to.query.v.toString()))),
      date: new Date(to.query.t.toString()),
      dateReferenceType: !!JSON.parse(to.query.tr.toString()) ? DateReferenceType.DEPARTURE : DateReferenceType.ARRIVAL,
    })
  }
  if (to.query.trip) {
    const trip = JSON.parse(decodeURIComponent(atob(to.query.trip.toString())))
    useTripsStore().selectTrip(trip)
  }

  if (to.name == 'trips') {
    await handleTripCollection(to)
  } else if (to.name == 'offers') {
    await handleOfferSearch(to)
  } else if (to.name == 'details') {
    await handleBooking(to)
  } else if (to.name == 'ticket') {
    await handleFulfillment(to)
  }
})

export default router
