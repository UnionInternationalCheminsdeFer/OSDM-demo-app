import type { components } from "@/schemas/schema";

export type StopPlaceRef = {
    objectType: "StopPlaceRef";
    stopPlaceRef: string,
}

export type AddressRef = {
    objectType: "AddressRef";
    addressRef: string,
}

export type FareConnectionPointRef = {
    objectType: "FareConnectionPointRef";
    fareConnectionPointRef: string,
}

export type GeoPositionRef = {
    objectType: "GeoPositionRef";
    geoPositionRef: string,
}

export type PointOfInterestRef = {
    objectType: "PointOfInterestRef";
    pointOfInterestRef: string,
}

export const convertPlaceToRef = (place: components["schemas"]["Place"]):  StopPlaceRef | AddressRef | FareConnectionPointRef | GeoPositionRef | PointOfInterestRef => {
    switch (place.objectType) {
        case 'StopPlace': {
            return {
                objectType: "StopPlaceRef",
                stopPlaceRef: place.id
            }
        }
        case 'Address': {
            return {
                objectType: "AddressRef",
                addressRef: place.id
            }
        }
        case 'FareConnectionPoint': {
            return {
                objectType: "FareConnectionPointRef",
                fareConnectionPointRef: place.id
            }
        }
        case 'GeoPosition': {
            return {
                objectType: "GeoPositionRef",
                geoPositionRef: place.id
            }
        }
        case 'PointOfInterest': {
            return {
                objectType: "PointOfInterestRef",
                pointOfInterestRef: place.id
            }
        }
    }
    throw Error(`Unknown Place Type ${place.objectType} found. One of [ StopPlace | Address | FareConnectionPoint | GeoPosition | PointOfInterest] are expected.`)
}

export const convertDateToOsdmDateTime = (date: Date): string => {
    return date.toISOString().split('Z')[0].split('.')[0]
}

export const convertDateToOsdmDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
}

export const convertOsdmDateToDate = (osdmDate: string): Date => {
    return new Date(osdmDate)
}


export const convertPassengerToAnonymousPassengerSpecification = (passenger: components['schemas']['Passenger']): components['schemas']['AnonymousPassengerSpecification'] => ({
    externalRef: passenger.externalRef,
    type: passenger.type,
    dateOfBirth: passenger.dateOfBirth,
});

export const convertTripToTripSpecification = (
    trip: components['schemas']['Trip'],
): components['schemas']['TripSpecification'] => ({
    externalRef: (trip.externalRef ?? trip.id) as string,
    legs: (trip.legs ?? [])
        .filter((l) => !!l?.timedLeg)
        .map((l, idx) => ({
            externalRef: (l.externalRef ?? String(idx)) as string,
            timedLeg: {
                start: {
                    stopPlaceRef: l.timedLeg!.start.stopPlaceRef,
                    serviceDeparture: {
                        timetabledTime: l.timedLeg!.start.serviceDeparture.timetabledTime,
                    },
                },
                end: {
                    stopPlaceRef: l.timedLeg!.end.stopPlaceRef,
                    serviceArrival: {
                        timetabledTime: l.timedLeg!.end.serviceArrival.timetabledTime,
                    },
                },
                service: {
                    vehicleNumbers: l.timedLeg!.service?.vehicleNumbers ?? [],
                    carriers: (l.timedLeg!.service?.carriers ?? []).map((c) => ({
                        ref: c.ref,
                    })),
                },
            },
        })),
});
