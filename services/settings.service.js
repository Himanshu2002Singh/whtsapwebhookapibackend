const axiosClient = require('../confiq/axios');
const appState = require('./appState.service');

function getPhoneNumberId() {
    return process.env.PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
}

function getWabaId() {
    return process.env.WABA_ID
        || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
        || process.env.META_WABA_ID
        || process.env.BUSINESS_ACCOUNT_ID
        || '';
}

function mapMetaProfile(phoneData = {}, businessProfile = {}) {
    return {
        number: phoneData.display_phone_number || '',
        displayName: phoneData.verified_name || '',
        businessCategory: businessProfile.vertical || '',
        about: businessProfile.about || '',
        qualityRating: phoneData.quality_rating || '',
        verifiedName: phoneData.verified_name || '',
        codeVerificationStatus: phoneData.code_verification_status || '',
        platformType: phoneData.platform_type || '',
        throughput: phoneData.throughput || null,
        address: businessProfile.address || '',
        description: businessProfile.description || '',
        email: businessProfile.email || '',
        profilePictureUrl: businessProfile.profile_picture_url || '',
        websites: businessProfile.websites || [],
        metaPhoneNumberId: getPhoneNumberId(),
        metaWabaId: getWabaId(),
        syncedAt: new Date().toISOString(),
    };
}

class SettingsService {
    async fetchMetaProfile() {
        const phoneNumberId = getPhoneNumberId();
        if (!phoneNumberId || !process.env.ACCESS_TOKEN) {
            throw new Error('PHONE_NUMBER_ID and ACCESS_TOKEN are required for Meta profile sync');
        }

        const [phoneResponse, profileResponse] = await Promise.all([
            axiosClient.get(`/${phoneNumberId}`, {
                params: { fields: 'display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput' },
            }),
            axiosClient.get(`/${phoneNumberId}/whatsapp_business_profile`, {
                params: { fields: 'about,address,description,email,profile_picture_url,websites,vertical' },
            }),
        ]);

        return mapMetaProfile(phoneResponse.data, profileResponse.data?.data?.[0] || {});
    }

    async syncMetaProfile() {
        const metaProfile = await this.fetchMetaProfile();
        const current = appState.getSettings();
        return appState.updateSettings({
            whatsapp: { ...current.whatsapp, ...metaProfile },
        });
    }

    async updateWhatsAppProfile(patch = {}) {
        const phoneNumberId = getPhoneNumberId();
        if (!phoneNumberId || !process.env.ACCESS_TOKEN) {
            throw new Error('PHONE_NUMBER_ID and ACCESS_TOKEN are required for Meta profile update');
        }

        const payload = { messaging_product: 'whatsapp' };
        ['about', 'address', 'description', 'email', 'vertical', 'websites'].forEach((key) => {
            if (patch[key] !== undefined) payload[key] = patch[key];
        });
        if (payload.vertical) {
            const verticalMap = {
                Technology: 'PROFESSIONAL',
                Retail: 'SHOPPING_RETAIL',
                Services: 'PROFESSIONAL',
            };
            payload.vertical = verticalMap[payload.vertical] || String(payload.vertical).toUpperCase();
        }
        if (Object.keys(payload).length === 1) throw new Error('At least one WhatsApp profile field is required');

        await axiosClient.post(`/${phoneNumberId}/whatsapp_business_profile`, payload);
        return this.syncMetaProfile();
    }
}

module.exports = new SettingsService();
