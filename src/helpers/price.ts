import type { components } from '@/schemas/schema'

const getCurrencySymbol = (currency: string) => {
  if (currency === 'EUR') {
    return '€'
  } else if (currency === 'CHF') {
    return 'CHF'
  } else if (currency === 'GBP') {
    return '£'
  } else if (currency === 'SEK') {
    return 'kr'
  } else if (currency === 'CZK') {
    return 'Kč'
  } else if (currency === 'BGN') {
    return 'lv'
  } else if (currency === 'DKK') {
    return 'dkr'
  } else if (currency === 'HRK') {
    return 'kn'
  } else if (currency === 'PLN') {
    return 'zł'
  } else {
    return '€'
  }
}

export const displayPrice = (
  price: components['schemas']['Price'],
  added: components['schemas']['Price'][] = [],
) => {
  const totalPrice =
    price.amount +
    added.reduce((p, c) => {
      if (c.currency == price.currency) {
        return p + c.amount
      } else {
        console.warn('Currency mismatch!')
      }
      return p
    }, 0)
  
  let priceInCurrency = totalPrice.toFixed(2)
  if (price.scale) {
    priceInCurrency = (totalPrice / Math.pow(10, price.scale)).toFixed(price.scale)
  }
  return `${priceInCurrency}${getCurrencySymbol(price.currency)}`
}

// Workaround to calculate total price
export const extractPriceFromOffer = (
  offer: components['schemas']['Offer'],
): components['schemas']['Price'] => {
  let amount = 0
  if (offer.admissionOfferParts
    && offer.admissionOfferParts.every((o) => offer.admissionOfferParts && o.price.currency === offer.admissionOfferParts[0].price.currency)
    && offer.admissionOfferParts.every((o) => offer.admissionOfferParts && o.price.scale === offer.admissionOfferParts[0].price.scale)) {
      amount += offer.admissionOfferParts?.reduce((acc, o) => o.price.amount + acc, 0);
  }

  if (offer.reservationOfferParts
    && offer.reservationOfferParts.every((o) => offer.reservationOfferParts && o.price.currency === offer.reservationOfferParts[0].price.currency)
    && offer.reservationOfferParts.every((o) => offer.reservationOfferParts && o.price.scale === offer.reservationOfferParts[0].price.scale)) {
      amount += offer.reservationOfferParts?.reduce((acc, o) => o.price.amount + acc, 0);
  }

  // ancillaryOfferParts are ignored as they are suspected to be optional

  return {
    amount,
    currency: offer.admissionOfferParts?.[0].price.currency ?? '',
    scale: offer.admissionOfferParts?.[0].price.scale ?? 0,
  }
}
