import { defineStore } from 'pinia'


type scoremap = {
    [key in string]: number[]
}
type attriscoremap = {
    [key in string]: number
}

export const useDataStore = defineStore('config', {
    state: () => ({
        standardScore: {} as scoremap,
        attriScoreLine: {} as attriscoremap,
        primaScoreLine: {} as attriscoremap,
        vaildline: 0,
        scanfrequency: ''
    })
})

