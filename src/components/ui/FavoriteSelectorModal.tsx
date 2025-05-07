import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonTextarea,
  IonButtons,
  IonIcon,
  useIonToast,
  IonCheckbox,
  IonNote,
} from "@ionic/react";
import { closeOutline, add } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  addPropertyToFolder,
  createFavoriteFolder,
  getFavoriteFolders,
  FavoriteFolder,
  getFoldersContainingProperty,
  removePropertyFromFolder,
} from "../../services/favoritesService";
import "./FavoriteSelectorModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  title: string;
  price: number;
  disposition: string;
  imageUrl: string;
}

const FavoriteSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  propertyId,
  title,
  price,
  disposition,
  imageUrl,
}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [note, setNote] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [showToast] = useIonToast();
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [initialFolders, setInitialFolders] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchFolders = async () => {
      const all = await getFavoriteFolders(user.uid);
      const alreadySaved = await getFoldersContainingProperty(
        user.uid,
        propertyId
      );
      setFolders(all);
      setSelectedFolders(alreadySaved);
      setInitialFolders(alreadySaved); //TODO: this fires on mount of propertydetails page
      console.log(all, alreadySaved);
    };

    getFavoriteFolders(user.uid).then(setFolders);
    fetchFolders();
  }, [user, propertyId]);

  const handleEditToFavorites = async () => {
    if (!user) return;

    // Add to selected folders
    const addPromises = selectedFolders.map((folderId) =>
      addPropertyToFolder(user.uid, folderId, propertyId, {
        id: propertyId,
        title,
        price,
        disposition,
        imageUrl,
        note,
      })
    );

    // Remove from folders that were initially selected but are no longer selected
    const removePromises = initialFolders
      .filter((folderId) => !selectedFolders.includes(folderId))
      .map((folderId) =>
        removePropertyFromFolder(user.uid, folderId, propertyId)
      );

    await Promise.all([...addPromises, ...removePromises]);

    showToast("Oblíbené položky byly aktualizovány", 2000);
    onClose();
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderTitle.trim()) return;

    const result = await createFavoriteFolder(user.uid, newFolderTitle.trim());

    if (!result.success) {
      showToast(result.error!, 2500);
      return;
    }

    // Folder created successfully
    setSelectedFolders((prev) => [...prev, result.id!]);
    setFolders((prev) => [
      ...prev,
      { id: result.id!, title: newFolderTitle.trim(), propertyCount: 0 },
    ]);
    setNewFolderTitle("");
  };

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="favorite-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uložit do oblíbených</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} fill="clear">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLabel>Vyberte složku:</IonLabel>
        {folders.map((folder) => (
          <IonItem key={folder.id}>
            <IonCheckbox
              slot="start"
              checked={selectedFolders.includes(folder.id)}
              onIonChange={(e) => {
                if (e.detail.checked) {
                  setSelectedFolders((prev) => [...prev, folder.id]);
                } else {
                  setSelectedFolders((prev) =>
                    prev.filter((id) => id !== folder.id)
                  );
                }
                console.log(initialFolders);
                console.log(selectedFolders);
              }}
            />
            <IonLabel>{folder.title}</IonLabel>
            <IonNote slot="end">{folder.propertyCount ?? 0}</IonNote>
          </IonItem>
        ))}

        <IonItem className="new-folder-item">
          <IonInput
            placeholder="Název nové složky"
            value={newFolderTitle}
            onIonInput={(e) => setNewFolderTitle(e.detail.value!.trim())}
          />
          <IonIcon
            icon={add}
            color="primary"
            size="large"
            slot="end"
            onClick={handleCreateFolder}
          />
        </IonItem>

        <IonLabel>Poznámka (volitelné):</IonLabel>
        <IonTextarea
          placeholder="Přidat poznámku k inzerátu..."
          value={note}
          onIonInput={(e) => setNote(e.detail.value!)}
        />

        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={handleEditToFavorites}
          disabled={
            arraysEqual(selectedFolders, initialFolders) &&
            initialFolders.length === 0
          }
        >
          Uložit
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default FavoriteSelectorModal;
