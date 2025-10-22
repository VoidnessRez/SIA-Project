import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user avatar on mount
  useEffect(() => {
    if (isOpen && user) {
      fetchAvatar();
    }
  }, [isOpen, user]);

  const fetchAvatar = async () => {
    try {
      console.log('[EditProfileModal] 📋 Fetching avatar for user:', user?.id);
      
      if (!user || !user.id) {
        console.error('[EditProfileModal] ❌ No user ID available');
        return;
      }
      
      // Fetch user profile for avatar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[EditProfileModal] ❌ Profile fetch error:', profileError);
        return;
      }

      if (profile?.avatar_url) {
        setPreviewImage(profile.avatar_url);
        console.log('[EditProfileModal] ✅ Avatar loaded:', profile.avatar_url);
      }
    } catch (error) {
      console.error('[EditProfileModal] 💥 Error fetching avatar:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      console.log('[EditProfileModal] ⚠️ No file selected');
      return;
    }

    console.log('[EditProfileModal] 📸 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('[EditProfileModal] ❌ File too large:', file.size);
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[EditProfileModal] ❌ Invalid file type:', file.type);
      setMessage({ type: 'error', text: 'File must be an image' });
      return;
    }

    // Store file for later upload
    setSelectedFile(file);
    setHasChanges(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      console.log('[EditProfileModal] ✅ Preview created');
    };
    reader.readAsDataURL(file);
    
    setMessage({ type: '', text: '' });
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an image first' });
      return;
    }

    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      // ✅ Upload through backend (bypasses Supabase RLS)
      console.log('[EditProfileModal] 📤 Uploading via backend API...');
      
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', selectedFile);
      formDataToSend.append('userId', user.id);

      const uploadResponse = await fetch('http://localhost:5174/api/upload/avatar', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('[EditProfileModal] ❌ Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('[EditProfileModal] ✅ Upload successful:', uploadResult);
      
      // ✅ Update preview and user context
      setPreviewImage(uploadResult.url);
      updateUserData({ avatar_url: uploadResult.url });
      setSelectedFile(null);
      setHasChanges(false);
      
      setMessage({ type: 'success', text: 'Image uploaded successfully! ✅' });
      
      // Auto-close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('[EditProfileModal] 💥 Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to upload image: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setUploading(false);
    }
  };

  console.log('[EditProfileModal] Render check - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('[EditProfileModal] Modal closed, not rendering');
    return null;
  }

  console.log('[EditProfileModal] 🎨 RENDERING MODAL NOW!');

  return (
    <div className="edit-profile-modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h2>✏️ Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="edit-profile-content">
          {/* Avatar Upload */}
          <div className="form-section avatar-section">
            <div 
              className="avatar-preview"
              onClick={() => previewImage && setShowImageViewer(true)}
              style={{ cursor: previewImage ? 'pointer' : 'default' }}
              title={previewImage ? 'Click to view full size' : ''}
            >
              {previewImage ? (
                <img src={previewImage} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
              {previewImage && (
                <div className="avatar-preview-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                  </svg>
                  <span>View Image</span>
                </div>
              )}
            </div>
            <div className="avatar-upload">
              <label htmlFor="avatar-upload" className="upload-btn">
                {uploading ? '⏳ Uploading...' : '📸 Change Photo'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <p className="upload-hint">JPG, PNG or GIF (Max 2MB)</p>
            </div>
            
            {/* Edit Your Information Button */}
            <button 
              type="button" 
              className="edit-info-btn"
              onClick={() => {
                console.log('🟢🟢🟢 [EditProfileModal] EDIT INFO BUTTON CLICKED! �🟢🟢');
                console.log('[EditProfileModal] Current location:', window.location.pathname);
                console.log('[EditProfileModal] About to close modal...');
                onClose();
                console.log('[EditProfileModal] Modal closed, now navigating...');
                console.log('[EditProfileModal] Target route: /personal-info');
                navigate('/personal-info');
                console.log('[EditProfileModal] ✅ navigate() called!');
                
                // Extra check after navigation
                setTimeout(() => {
                  console.log('[EditProfileModal] After 100ms - Current location:', window.location.pathname);
                  console.log('[EditProfileModal] Did we reach personal-info?', window.location.pathname === '/personal-info' ? '✅ YES!' : '❌ NO!');
                }, 100);
              }}
            >
              ✏️ Edit Your Information
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={uploading}
            >
              Close
            </button>
            {hasChanges && (
              <button 
                type="button" 
                className="btn-save"
                onClick={handleSaveAvatar}
                disabled={uploading}
              >
                {uploading ? '⏳ Saving...' : '💾 Save Avatar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && previewImage && (
        <div className="image-viewer-overlay" onClick={() => setShowImageViewer(false)}>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={() => setShowImageViewer(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <img src={previewImage} alt="Profile preview" className="image-viewer-image" />
            <div className="image-viewer-caption">
              <h3>Profile Picture</h3>
              <p>Click outside or press ESC to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileModal;
