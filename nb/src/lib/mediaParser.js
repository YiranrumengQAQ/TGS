/**
 * Media parser — direct port of the M3 app's MediaParser.
 * Extracts sticker / animation / image-document / video from a message
 * and resolves its real file URL (+ optional thumbnail).
 */
export const MediaParser = {
    async parseMessage(botCore, message) {
        let mediaData = null;
        let type = 'unknown';
        let sourceCategory = 'unknown';

        if (message.sticker) {
            mediaData = message.sticker;
            sourceCategory = 'sticker';
            if (mediaData.is_animated) type = 'tgs';
            else if (mediaData.is_video) type = 'webm';
            else type = 'webp';
        } else if (message.animation) {
            mediaData = message.animation;
            sourceCategory = 'animation';
            type = mediaData.mime_type === 'video/mp4' ? 'mp4' : 'gif';
        } else if (message.document && message.document.mime_type && message.document.mime_type.includes('image')) {
            mediaData = message.document;
            sourceCategory = 'document';
            type = mediaData.mime_type.split('/')[1] || 'unknown';
        } else if (message.video) {
            mediaData = message.video;
            sourceCategory = 'video';
            type = 'mp4';
        }

        if (!mediaData) return null;

        const fileUrl = await botCore.getFileUrl(mediaData.file_id);
        let thumbnail = null;
        if (mediaData.thumbnail) {
            try {
                thumbnail = await botCore.getFileUrl(mediaData.thumbnail.file_id);
            } catch (_) {}
        }

        return {
            fileId: mediaData.file_id,
            type,
            originalUrl: fileUrl,
            emoji: mediaData.emoji || null,
            setName: mediaData.set_name || null,
            fileSize: mediaData.file_size || null,
            dimensions: `${mediaData.width || '?'}×${mediaData.height || '?'}`,
            mimeType: mediaData.mime_type || null,
            sourceCategory,
            thumbnail,
            timestamp: Date.now(),
        };
    },
};
