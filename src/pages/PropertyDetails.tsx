import { IonContent, IonPage } from "@ionic/react";
import React from "react";
import { db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface PropertyDetailsProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const fetchDocument = async (id: string) => {
  const docRef = doc(db, "properties", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as PropertyDetailsProps;
    console.log("Document data:", data);
    return data;
  } else {
    console.log("No such document!");
    return null;
  }
};

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetailsProps | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchDocument(id).then((data) => {
      if (data) {
        setPropertyDetails(data);
      }
    });
  }, [id]);

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <h1>Property Details</h1>
        <p>Property Title: {propertyDetails?.title}</p>
        <p>Property Price: {propertyDetails?.price}</p>
        <p>Property Image URL: {propertyDetails?.imageUrl}</p>
      </IonContent>
    </IonPage>
  );
};

export default PropertyDetails;
