const axiosClient = require("../confiq/axios");

function getWabaId() {
    return process.env.WABA_ID
        || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
        || process.env.META_WABA_ID
        || process.env.BUSINESS_ACCOUNT_ID
        || '';
}

function normalizeLanguage(language) {
    return String(language || '').trim().replace('-', '_').toLowerCase();
}

function toMetaLanguage(language) {
    const value = String(language || '').trim().replace('-', '_');
    const [locale, region] = value.split('_');
    return region ? `${locale.toLowerCase()}_${region.toUpperCase()}` : locale.toLowerCase();
}

function normalizeTemplateStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'approved') return 'approved';
    if (value === 'pending') return 'pending';
    if (value === 'rejected') return 'rejected';
    if (value === 'paused') return 'paused';
    if (value === 'disabled') return 'disabled';
    if (value === 'in_appeal') return 'in_appeal';
    return value || 'pending';
}

function buildBodyComponents(body) {
    const text = String(body || '').trim();
    const variables = Array.from(new Set((text.match(/\{\{\d+\}\}/g) || []))).length;
    const component = { type: 'BODY', text };

    if (variables) {
        component.example = {
            body_text: [Array.from({ length: variables }, (_, index) => `Sample ${index + 1}`)],
        };
    }

    return [component];
}

function buildTemplatePayload(template) {
    return {
        name: template.name,
        language: toMetaLanguage(template.language) || 'en_US',
        category: String(template.category || 'utility').toUpperCase(),
        components: buildBodyComponents(template.body),
    };
}

class MetaTemplatesService {
    isConfigured() {
        return !!(process.env.ACCESS_TOKEN && getWabaId());
    }

    async listTemplates() {
        const wabaId = getWabaId();
        if (!wabaId) {
            throw new Error('WABA_ID is not configured');
        }

        const items = [];
        let after;

        do {
            const response = await axiosClient.get(`/${wabaId}/message_templates`, {
                params: {
                    limit: 100,
                    fields: 'name,status,language,category,components,quality_score,previous_category,rejected_reason,last_updated_time',
                    ...(after ? { after } : {}),
                },
            });

            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            items.push(...data);
            after = response.data?.paging?.cursors?.after || '';
        } while (after);

        return items;
    }

    async getTemplateByName(name) {
        const wabaId = getWabaId();
        if (!wabaId) {
            throw new Error('WABA_ID is not configured');
        }

        const response = await axiosClient.get(`/${wabaId}/message_templates`, {
            params: {
                name,
                fields: 'name,status,language,category,components,quality_score,previous_category,rejected_reason,last_updated_time',
            },
        });

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        return items[0] || null;
    }

    async createTemplate(template) {
        const wabaId = getWabaId();
        if (!wabaId) {
            throw new Error('WABA_ID is not configured');
        }

        const response = await axiosClient.post(`/${wabaId}/message_templates`, buildTemplatePayload(template));
        return response.data;
    }

    async updateTemplate(templateId, template) {
        if (!templateId) {
            throw new Error('templateId is required');
        }

        const response = await axiosClient.post(`/${templateId}`, buildTemplatePayload(template));
        return response.data;
    }

    async deleteTemplateById(templateId) {
        if (!templateId) {
            throw new Error('templateId is required');
        }

        const response = await axiosClient.delete(`/${templateId}`);
        return response.data;
    }

    async deleteTemplateByName(name) {
        const wabaId = getWabaId();
        if (!wabaId) {
            throw new Error('WABA_ID is not configured');
        }

        const response = await axiosClient.delete(`/${wabaId}/message_templates`, {
            params: { name },
        });
        return response.data;
    }

    normalizeTemplateStatus(status) {
        return normalizeTemplateStatus(status);
    }

    normalizeLanguage(language) {
        return normalizeLanguage(language);
    }
}

module.exports = new MetaTemplatesService();
