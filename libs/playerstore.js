import * as storeUtil from 'jutore';

const store = storeUtil.setScope('nodemodules_woostream_playing', {
    id: 0
});

export const setCurrent = (id) => {
    store.set('id', id);
}

export const getCurrent = () => {
    return store.get('id');
}

export default store;