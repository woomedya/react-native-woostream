import * as storeUtil from 'jutore';

const store = storeUtil.setScope('nodemodules_woostream_main', {
    state: {
        id: 0
    }
});

export const STATE = 'state';

export const setCurrent = (state) => {
    var old = getCurrent();
    var newState = Object.assign(old, state);
    store.set(STATE, newState);
}

export const getCurrent = () => {
    return store.get(STATE);
}

export default store;