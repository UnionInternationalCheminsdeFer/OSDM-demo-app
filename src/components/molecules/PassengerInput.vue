<template>
    <div class="relative">
        <div
            class="flex items-center font-bold text-sm rounded-full pl-4 py-1 w-fit bg-osdm-gray text-osdm-text-secondary gap-4">
            <div class="flex items-center ">
                <sbb-icon name="walk-slow-small"></sbb-icon>
                <span>{{ summaryString(selectedPassengers) }}</span>

            </div>
            <button @click="togglePopover"
                class="bg-white rounded-full py-1 my-[-20px] px-4 border border-osdm-text-secondary text-osdm-text-secondary flex items-center">
                <sbb-icon name="pen-small"></sbb-icon>
            </button>
        </div>
        <div v-if="expanded"
            class="absolute w-fit bg-osdm-bg-white shadow-lg rounded-lg p-4 border left-0 top-full mt-2 flex flex-col gap-2 min-w-48 z-20"
            ref="popout">
            <div class="flex items-center justify-between">
                <h2>Passengers</h2>
                <sbb-button icon-name="plus-small" size="s" @click="addPassenger"></sbb-button>
            </div>
            <hr class="my-2">
            <div class="flex flex-col gap-2" v-for="(passenger, index) in selectedPassengers"
                :key="`passenger-${index}`">
                <hr class="my-1 border-dashed" v-if="index != 0">
                <div class="flex gap-2 w-full justify-between">

                    {{ `Passenger ${index + 1}` }}
                    <button v-if="index > 0" @click="() => removePassenger(index)">
                        <sbb-icon name="trash-small" />
                    </button>
                </div>

                <div class="flex flex-col gap-2">
                    <InputDate size="s" name="Birthday" :value="getBirthdate(passenger)"
                        :select-callback="(selectedDate: Date | null) => updatePassengerDate(selectedDate, index)" />

                    <div class="flex gap-2 items-center">
                        <InputNumber size="s" class="min-w-24" name="Age" :value="passenger.age"
                            :min="0" :max="150"
                            @input="(event: Event) => updatePassengerAge(event, index)" />

                        <div class="flex flex-col">
                            <label class="text-sm font-semibold">Type</label>
                            <select class="border rounded px-2 py-1 text-sm" :value="passenger.type"
                                @change="(event: Event) => updatePassengerType(event, index)">
                                <option v-for="type in passengerTypes" :key="type" :value="type">{{ type }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { components } from '@/schemas/schema';
import { SbbIconElement as SbbIcon } from '@sbb-esta/lyne-elements/icon'
import InputDate from '../atoms/InputDate.vue';
import { convertDateToOsdmDate, convertOsdmDateToDate } from '@/helpers/conversions';
import InputNumber from '../atoms/InputNumber.vue';

export default {
    components: {
        SbbIcon,
        InputDate,
        InputNumber,
    },
    props: {
        selectedPassengers: {
            type: Array<components['schemas']['Passenger']>,
            required: true,
        },
        selectCallback: {
            type: Function,
            required: true,
        },
    },
    data() {
        return {
            expanded: false,
            passengerTypes: ['PERSON', 'DOG', 'BICYCLE', 'LUGGAGE'] as components['schemas']['PassengerType'][]
        }
    },
    methods: {
        summaryString(passengers: components['schemas']['Passenger'][]) {
            if (passengers.length == 1) {
                return "1 Passenger"
            }
            return `${passengers.length} Passengers`
        },
        togglePopover(event: MouseEvent) {
            event.stopPropagation();
            this.expanded = !this.expanded;

            if (this.expanded) {
                window.addEventListener("click", this.checkClickOutside)
            } else {
                window.removeEventListener("click", this.checkClickOutside)
            }
        },
        checkClickOutside(event: MouseEvent) {
            let targetParent = (event.target as HTMLElement);
            while (targetParent.parentElement) {
                if (targetParent == this.$refs.popout) {
                    return;
                }
                targetParent = targetParent.parentElement
            }
            this.expanded = false;
            window.removeEventListener("click", this.checkClickOutside)
        },
        getDummyDate() {
            const dummyBirthdate = new Date(Date.now());
            dummyBirthdate.setFullYear(dummyBirthdate.getFullYear() - 27)
            return dummyBirthdate
        },
        addPassenger() {
            this.selectCallback([...this.selectedPassengers, {
                id: `passenger_0${this.selectedPassengers.length + 1}`,
                externalRef: `passenger_0${this.selectedPassengers.length + 1}`,
                dateOfBirth: convertDateToOsdmDate(this.getDummyDate()),
                age: null,
                type: 'PERSON',
            }])
        },
        updatePassengerDate(selectedDate: Date | null, index: number) {
            const updatedPassengers = [...this.selectedPassengers];
            updatedPassengers[index].dateOfBirth = selectedDate ? convertDateToOsdmDate(selectedDate) : null;
            this.selectCallback(updatedPassengers)
        },
        updatePassengerAge(event: Event, index: number) {
            const value = (event.target as HTMLInputElement).value;
            const updatedPassengers = [...this.selectedPassengers];
            updatedPassengers[index].age = value === '' ? null : Number(value);
            this.selectCallback(updatedPassengers)
        },
        updatePassengerType(event: Event, index: number) {
            const value = (event.target as HTMLSelectElement).value as components['schemas']['PassengerType'];
            const updatedPassengers = [...this.selectedPassengers];
            updatedPassengers[index].type = value;
            this.selectCallback(updatedPassengers)
        },
        getBirthdate(passenger: components['schemas']['Passenger']) {
            if (passenger.dateOfBirth) {
                return convertOsdmDateToDate(passenger.dateOfBirth)
            }
            return null
        },
        removePassenger(index: number) {
            if (index > 0) {
                this.selectCallback(this.selectedPassengers?.filter((s, i) => i != index))
            }
        }
    }
}
</script>
