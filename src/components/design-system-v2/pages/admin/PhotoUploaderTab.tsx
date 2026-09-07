'use client';

import React, { useState } from 'react';
import {
    uploadFighterPhoto,
} from '@/lib/api';

export function PhotoUploaderTab() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Limpia la URL de preview al cambiar archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setResultUrl(null);

        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Selecciona un archivo primero');
            return;
        }

        setUploading(true);
        try {
            const data = await uploadFighterPhoto(selectedFile);
            alert(`✅ Foto subida correctamente: ${data.s3_key}`);
            setResultUrl(data.cloudfront_url);
        } catch (error: any) {
            console.error(error);
            alert(`❌ ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Limpiar object URL al desmontar
    React.useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <div className="admin-tab-content admin-tab-content--active">
            <h2 className="admin-section-title">PHOTO UPLOADER</h2>
            <p style={{ color: '#999', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Sube fotos de peleadores. El nombre del archivo se usa como clave en S3. Formatos: PNG, JPG.
            </p>

            {/* Selector de archivo */}
            <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="admin-form-label">SELECCIONAR FOTO</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{
                        padding: '0.75rem',
                        border: '2px solid #333',
                        borderRadius: '4px',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        width: '100%',
                    }}
                />
            </div>

            {/* Nombre que se usara en S3 */}
            {selectedFile && (
                <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-form-label">NOMBRE EN S3</label>
                    <div style={{
                        padding: '0.75rem',
                        border: '2px solid #333',
                        borderRadius: '4px',
                        backgroundColor: '#1a1a1a',
                        color: '#4ade80',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                    }}>
                        fighters/{selectedFile.name}
                    </div>
                </div>
            )}

            {/* Preview de la imagen */}
            {previewUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>PREVIEW</label>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                            maxWidth: '300px',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            border: '2px solid #333',
                            objectFit: 'contain',
                            backgroundColor: '#0a0a0a',
                        }}
                    />
                </div>
            )}

            {/* Boton de subida */}
            <div className="admin-btn-group">
                <button
                    className="admin-btn admin-btn--primary"
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                >
                    {uploading ? 'UPLOADING...' : 'UPLOAD PHOTO'}
                </button>
            </div>

            {/* URL de CloudFront tras subida exitosa */}
            {resultUrl && (
                <div className="admin-alert admin-alert--success" style={{ marginTop: '1.5rem' }}>
                    <span>✓ CloudFront URL:</span>
                    <a
                        href={resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4ade80', marginLeft: '0.5rem', wordBreak: 'break-all' }}
                    >
                        {resultUrl}
                    </a>
                </div>
            )}
        </div>
    );
}

// ===== MANAGE BOUTS TAB =====
// Permite editar detalles de peleas y eliminarlas
