
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { TaskPlan, User } from '../types';

export const savePlanToHistory = async (user: User, plan: TaskPlan) => {
  if (!user || !user.id || !db) return;

  try {
    const historyRef = collection(db, 'users', user.id, 'history');
    await addDoc(historyRef, {
      ...plan,
      savedAt: Date.now(),
      type: 'task_decomposition_v1'
    });
    console.log('Data Story saved successfully to Firestore');
  } catch (error) {
    console.error('Error saving data story:', error);
  }
};

export const fetchUserHistory = async (user: User): Promise<TaskPlan[]> => {
  if (!user || !user.id || !db) return [];

  try {
    const historyRef = collection(db, 'users', user.id, 'history');
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TaskPlan);
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};
