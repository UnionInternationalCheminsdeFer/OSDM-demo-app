<template>
  <main class="h-full">
    <HeaderBar />

    <div v-if="error" class="flex flex-col items-center mt-12 h-full gap-4">
      <sbb-icon :name="error.icon"></sbb-icon>
      <h2>{{ error.title }}</h2>
      <span>{{ error.description }}</span>
    </div>

    <div v-else class="flex flex-col items-center mt-12 h-full gap-4 w-full">
      <sbb-loading-indicator v-if="loading" />
      <span v-if="loading">{{ status }}</span>

      <div v-if="!loading" class="w-full max-w-3xl px-4 flex flex-col gap-6">
        <h2>Refund offers</h2>

        <div v-if="!bookingId" class="p-4 border rounded">
          The <b>bookingId</b> is missing from the query. For example: <code>/refund-offers?bookingId=...</code>
        </div>

        <div v-else>
          <h3>Select the fulfillments to be refunded</h3>

          <div v-if="fulfillments.length === 0" class="p-4 border rounded">
            There are no fulfillments in this booking (a fulfillment must be created first).
          </div>

          <div v-else class="flex flex-col gap-2">
            <label v-for="f in fulfillments" :key="f.id" class="flex items-center gap-2">
              <input type="checkbox" :value="f.id" v-model="selectedFulfillmentIds" />
              <span>{{ f.id }}</span>
            </label>

            <sbb-button
              icon-name="chevron-right-small"
              size="m"
              :disabled="selectedFulfillmentIds.length === 0"
              @click="loadRefundOffers"
            >
              Request refund offers
            </sbb-button>
          </div>
        </div>

        <div v-if="refundOffers.length">
          <h3>Received refund offers</h3>

          <div
            v-for="o in refundOffers"
            :key="o.id"
            class="p-4 border rounded flex flex-col gap-1"
          >
            <div><b>ID:</b> {{ o.id }}</div>
            <div>
              <b>Refundable amount:</b>
              {{ o.refundableAmount?.amount }} {{ o.refundableAmount?.currency }}
            </div>
            <div>
              <b>Fee:</b>
              {{ o.refundFee?.amount }} {{ o.refundFee?.currency }}
            </div>
            <div><b>Valid until:</b> {{ o.validUntil }}</div>
            <div class="mt-2 flex gap-2 items-center">
                <sbb-button
                  icon-name="chevron-right-small"
                  size="m"
                  :disabled="loading"
                  @click="confirmOffer(o.id)"
                >
                  Confirm refund offer
                </sbb-button>

                <span v-if="confirmedRefundOfferId === o.id">Confirmed ✅</span>
              </div>
          </div>
        </div>

        <div v-else-if="refundOffersLoaded" class="p-4 border rounded">
          No refund offers were returned.
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import HeaderBar from '@/components/molecules/HeaderBar.vue'
import { SbbLoadingIndicatorElement as SbbLoadingIndicator } from '@sbb-esta/lyne-elements/loading-indicator'
import { inject } from 'vue'
import { osdmClientKey } from '@/types/symbols'
import { BookingError, useBookingStore } from '@/stores/booking'

export default {
  components: { HeaderBar, SbbLoadingIndicator },

  data() {
    return {
      loading: false,
      status: '',
      booking: null as any,
      selectedFulfillmentIds: [] as string[],
      refundOffers: [] as any[],
      refundOffersLoaded: false,
      confirmedRefundOfferId: null as string | null,
    }
  },

  computed: {
    error() {
      return useBookingStore().error
    },
    bookingId(): string | null {
      const v = this.$route.params.bookingId
      return v ? v.toString() : null
    },
    fulfillments(): any[] {
    console.log(this.booking)
      return this.booking?.fulfillments ?? []
    },
  },
  inject: {
    OSDM: { from: osdmClientKey },
  },
  async mounted() {
    if (!this.bookingId) return

    try {
      this.loading = true
      this.status = 'Loading booking...'

      const OSDM = this.OSDM
      const res = await OSDM?.booking.getBooking(this.bookingId)
      this.booking = res?.data?.booking ?? null
    } catch (e) {
      useBookingStore().setError(
        new BookingError(
          'An error occurred',
          'Could not load booking',
          'sign-exclamation-point-medium',
        ),
      )
    } finally {
      this.loading = false
      this.status = ''
    }
  },
  methods: {
    async loadRefundOffers() {
      if (!this.bookingId) return

      try {
        this.loading = true
        this.status = 'Requesting refund offers...'
        this.refundOffersLoaded = false

        const OSDM = this.OSDM
        const res = await OSDM?.booking.requestRefundOffers(this.bookingId, {
          fulfillmentIds: this.selectedFulfillmentIds,
        })

        this.refundOffers = res?.data?.refundOffers ?? []
        this.refundOffersLoaded = true
      } catch (e) {
        useBookingStore().setError(
          new BookingError(
            'An error occurred',
            'Refund-offers request failed',
            'sign-exclamation-point-medium',
          ),
        )
      } finally {
        this.loading = false
        this.status = ''
      }
    },
    async confirmOffer(refundOfferId: string) {
      if (!this.bookingId) return
      if (!this.OSDM) return

      try {
        this.loading = true
        this.status = 'Confirming refund offer...'
        this.confirmedRefundOfferId = null

        await this.OSDM.booking.confirmRefundOffer(
          this.bookingId,
          refundOfferId,
          { status: 'CONFIRMED' },
        )

        this.confirmedRefundOfferId = refundOfferId

        // opcional: if we want to refresh the booking/state:
        // const b = await this.OSDM.booking.getBooking(this.bookingId)
        // this.booking = b?.data?.booking ?? null
      } catch (e) {
        // useBookingStore().setError(new BookingError(...))
        console.error('Confirm refund offer failed', e)
      } finally {
        this.loading = false
        this.status = ''
      }
    },
  },
}
</script>
