import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { FileImage, FileText, FolderOpen, Plus, Search, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VaultItem = {
  file: File;
  kind: 'PDF' | 'IMAGE';
};

const INK = '#18232B';
const TEAL = '#168F87';
const MUTED = '#667783';
const BORDER = '#D7E4EA';

function getVaultDirectory() {
  return Platform.OS === 'web' ? null : new Directory(Paths.document, 'asonyx-vault');
}

function getKind(name: string): VaultItem['kind'] {
  return /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(name) ? 'IMAGE' : 'PDF';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'Document';
}

export default function DocumentsScreen() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');

  const refresh = useCallback(() => {
    try {
      const vaultDirectory = getVaultDirectory();
      if (!vaultDirectory) {
        setItems([]);
        return;
      }
      if (!vaultDirectory.exists) vaultDirectory.create({ intermediates: true, idempotent: true });
      const saved = vaultDirectory.list()
        .filter((entry): entry is File => entry instanceof File)
        .map(file => ({ file, kind: getKind(file.name) }))
        .sort((a, b) => b.file.name.localeCompare(a.file.name));
      setItems(saved);
    } catch {
      Alert.alert('Vault unavailable', 'The app could not read its local document folder.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reading the private vault is the screen's initial external synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  const visibleItems = useMemo(() => items.filter(item => {
    const matchesFilter = filter === 'ALL' || item.kind === filter;
    const matchesSearch = item.file.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  }), [filter, items, query]);

  const importDocuments = async () => {
    try {
      setImporting(true);
      const vaultDirectory = getVaultDirectory();
      if (!vaultDirectory) {
        Alert.alert('Vault unavailable', 'The Document Vault is available in the Android and iOS app.');
        return;
      }
      if (!vaultDirectory.exists) vaultDirectory.create({ intermediates: true, idempotent: true });
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;

      for (const asset of result.assets) {
        const baseName = cleanFileName(asset.name);
        const dot = baseName.lastIndexOf('.');
        const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
        const extension = dot > 0 ? baseName.slice(dot) : '';
        let storedName = baseName;
        let destination = new File(vaultDirectory, storedName);
        let collision = 2;
        while (destination.exists) {
          storedName = `${stem} (${collision++})${extension}`;
          destination = new File(vaultDirectory, storedName);
        }
        await new File(asset.uri).copy(destination);
      }
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Import failed', message);
    } finally {
      setImporting(false);
    }
  };

  const previewDocument = async (file: File) => {
    try {
      const mimeType = getKind(file.name) === 'PDF' ? 'application/pdf' : undefined;
      if (!await file.canPreview({ mimeType })) {
        Alert.alert('Preview unavailable', 'No compatible viewer is available for this file.');
        return;
      }
      await file.preview({ title: file.name, mimeType });
    } catch {
      Alert.alert('Could not open document', 'Try opening this file with another app on your device.');
    }
  };

  const removeDocument = (file: File) => {
    Alert.alert('Delete document?', `Remove “${file.name}” from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        try {
          file.delete();
          refresh();
        } catch {
          Alert.alert('Could not delete file', 'The document could not be removed from the vault.');
        }
      } },
    ]);
  };

  const totalSize = items.reduce((total, item) => total + item.file.size, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: INK, fontSize: 25, fontWeight: '800' }}>Document Vault</Text>
          <Text style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Your helmet and ride documents, stored on this device</Text>
        </View>

        <View style={{ backgroundColor: '#E0F3F3', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#C4E6E4', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <FolderOpen size={23} color={TEAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: INK, fontSize: 15, fontWeight: '800' }}>{items.length} {items.length === 1 ? 'document' : 'documents'}</Text>
            <Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>{formatSize(totalSize)} stored privately in app storage</Text>
          </View>
        </View>

        <TouchableOpacity onPress={importDocuments} disabled={importing} activeOpacity={0.85} style={{ minHeight: 52, borderRadius: 14, backgroundColor: '#20C9CC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 17, opacity: importing ? 0.7 : 1 }}>
          {importing ? <ActivityIndicator color="#073536" /> : <><Plus size={19} color="#073536" strokeWidth={2.6} /><Text style={{ color: '#073536', fontSize: 15, fontWeight: '800', marginLeft: 7 }}>Add Documents</Text></>}
        </TouchableOpacity>

        <View style={{ height: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 13 }}>
          <Search size={18} color="#8999A3" />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search documents..." placeholderTextColor="#91A0AA" style={{ flex: 1, color: INK, marginLeft: 9, fontSize: 14 }} returnKeyType="search" />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['ALL', 'PDF', 'IMAGE'] as const).map(value => (
            <TouchableOpacity key={value} onPress={() => setFilter(value)} style={{ borderRadius: 20, backgroundColor: filter === value ? '#178E87' : '#FFFFFF', borderWidth: 1, borderColor: filter === value ? '#178E87' : BORDER, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ color: filter === value ? '#FFFFFF' : MUTED, fontSize: 11, fontWeight: '800' }}>{value === 'IMAGE' ? 'IMAGES' : value === 'ALL' ? `ALL (${items.length})` : `PDF (${items.filter(item => item.kind === 'PDF').length})`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#52616B', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 }}>SAVED ON THIS DEVICE</Text>
        {loading ? <ActivityIndicator color={TEAL} style={{ marginTop: 30 }} /> : visibleItems.length === 0 ? (
          <View style={{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: BORDER, padding: 25, marginTop: 3 }}>
            <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: '#E8F7F6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><FolderOpen size={27} color={TEAL} /></View>
            <Text style={{ color: INK, fontSize: 16, fontWeight: '800' }}>{query ? 'No matching documents' : 'Your vault is empty'}</Text>
            <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 }}>{query ? 'Try another name or change the file filter.' : 'Add PDF or image files such as receipts, manuals, and ride documents.'}</Text>
          </View>
        ) : visibleItems.map(({ file, kind }) => {
          const Icon = kind === 'PDF' ? FileText : FileImage;
          const displayName = file.name;
          return (
            <TouchableOpacity key={file.uri} onPress={() => previewDocument(file)} activeOpacity={0.85} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 15, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 43, height: 43, backgroundColor: kind === 'PDF' ? '#FFF3F1' : '#EAF7F5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 }}><Icon size={21} color={kind === 'PDF' ? '#D96859' : TEAL} /></View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 13, fontWeight: '700' }}>{displayName}</Text>
                <Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>{kind}  ·  {formatSize(file.size)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeDocument(file)} accessibilityLabel={`Delete ${displayName}`} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F4' }}><Trash2 size={17} color="#C96A60" /></TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <Text style={{ color: '#81919A', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 15 }}>Files stay in this app’s private storage and are not uploaded. Removing the app also removes its stored files.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
