import { config, } from 'react-native-woostream';
import i18n from '../locales';
import { Platform } from 'react-native';

export default async () => {
    config({
        title: i18n().share.title,
        message: i18n().share.message,
        url: Platform.OS === 'android' ? i18n().share.androidUrl : i18n().share.iosUrl,
        iconPlay: null,
        iconPause: null,
        iconNext: null,
        iconVolume: null,
        iconShare: null,
        iconFavoriDisable: null,
        iconFavoriEnable: null,
        backgroundImage: null,
    });
}