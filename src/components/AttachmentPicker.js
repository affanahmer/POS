import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageWithProgress } from '../services/supabase';

const AttachmentPicker = ({ onImageSelected, currentImage, orderId }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const showImagePicker = () => {
    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = async response => {
    if (response.didCancel || response.error) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const imageUri = response.assets[0].uri;

      if (imageUri) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          // Upload image to Supabase storage
          const uploadResult = await uploadImageWithProgress(imageUri, orderId);

          if (uploadResult.success) {
            onImageSelected(uploadResult.publicUrl);
            Alert.alert('Success', 'Image uploaded successfully!');
          } else {
            Alert.alert(
              'Error',
              'Failed to upload image: ' + uploadResult.error,
            );
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image: ' + error.message);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    }
  };

  const removeImage = () => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onImageSelected(''),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Order Attachments</Text>

      <View style={styles.content}>
        {currentImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImage }} style={styles.image} />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={showImagePicker}
                disabled={isUploading}
              >
                <Text style={styles.actionButtonText}>Change Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={removeImage}
                disabled={isUploading}
              >
                <Text
                  style={[styles.actionButtonText, styles.removeButtonText]}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderTitle}>No Image Selected</Text>
              <Text style={styles.placeholderSubtitle}>
                Add a photo of the garment or customer reference
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={showImagePicker}
              disabled={isUploading}
            >
              <Text style={styles.addButtonText}>Add Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {isUploading && (
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.uploadText}>Uploading image...</Text>
          </View>
        )}

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Image Guidelines:</Text>
          <Text style={styles.helpText}>
            • Take clear, well-lit photos{'\n'}• Include front and back views if
            needed{'\n'}• Show fabric details and patterns{'\n'}• Keep file size
            under 5MB
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  content: {
    gap: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  removeButtonText: {
    color: '#fff',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  placeholder: {
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  uploadText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2196F3',
  },
  helpContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default AttachmentPicker;
