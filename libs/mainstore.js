import * as storeUtil from 'jutore';

const store = storeUtil.setScope('nodemodules_woostream_main', {
    state: {
        id: 0
    }
});

export const STATE = 'state';

export const setCurrent = (id, state) => {
    store.set(STATE, Object.assign({ id }, state));
}

export const getCurrent = () => {
    return store.get(STATE);
}

export default store;