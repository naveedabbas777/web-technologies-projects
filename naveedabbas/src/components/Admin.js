import { useEffect, useMemo, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import db, { auth, storage } from '../firebase';
import { normalizeImageUrl } from '../utils';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import useFirestoreDoc from '../hooks/useFirestoreDoc';
import {
  addOrderedItem,
  isUserAdmin,
  removeItem,
  reorderItems,
  saveSettingsDoc,
  setProfileImage as setProfileImageService,
  updateItem,
  uploadFileToStorage,
  uploadFileToCloudinary,
} from '../services/adminService';
import AdminAccessDenied from '../pages/Admin/AdminAccessDenied';
import AdminProfileTab from '../pages/Admin/AdminProfileTab';
import AdminHeroTab from '../pages/Admin/AdminHeroTab';
import AdminProjectsTab from '../pages/Admin/AdminProjectsTab';
import AdminAchievementsTab from '../pages/Admin/AdminAchievementsTab';
import AdminSkillsTab from '../pages/Admin/AdminSkillsTab';
import AdminResumeSectionsTab from '../pages/Admin/AdminResumeSectionsTab';
import AdminMessagesTab from '../pages/Admin/AdminMessagesTab';
import AdminWorkExperienceTab from '../pages/Admin/AdminWorkExperienceTab';

const DEFAULT_SECTION_VISIBILITY = {
  skills: { showOnSite: true, showOnResume: true },
  achievements: { showOnSite: true, showOnResume: true },
  projects: { showOnSite: true, showOnResume: true },
  workExperience: { showOnSite: true, showOnResume: true },
  specialization: { showOnSite: true, showOnResume: true },
  education: { showOnSite: true, showOnResume: true },
  awards: { showOnSite: true, showOnResume: true },
  resume: { showOnSite: true, showOnResume: true },
};

function mergeVisibility(incoming) {
  const next = {};
  Object.keys(DEFAULT_SECTION_VISIBILITY).forEach((key) => {
    next[key] = { ...DEFAULT_SECTION_VISIBILITY[key], ...(incoming?.[key] || {}) };
  });
  return next;
}

function moveItem(items, draggedId, targetId) {
  const fromIndex = items.findIndex((x) => x.id === draggedId);
  const toIndex = items.findIndex((x) => x.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return items;
  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}

function checkImageReachable(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    const t = setTimeout(() => resolve(false), 8000);
    img.onload = () => {
      clearTimeout(t);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}

function Admin() {
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [sectionVisibility, setSectionVisibility] = useState(() => ({ ...DEFAULT_SECTION_VISIBILITY }));

  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [profileUrlInput, setProfileUrlInput] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [heroPreviewError, setHeroPreviewError] = useState(false);

  const [profileFile, setProfileFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [heroFile, setHeroFile] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [projectImageUrl, setProjectImageUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechnologies, setProjectTechnologies] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [projectRepoLink, setProjectRepoLink] = useState('');
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editProjectImageUrl, setEditProjectImageUrl] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectTechnologies, setEditProjectTechnologies] = useState('');
  const [editProjectLink, setEditProjectLink] = useState('');
  const [editProjectRepoLink, setEditProjectRepoLink] = useState('');
  const [editProjectImageFile, setEditProjectImageFile] = useState(null);

  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementYear, setAchievementYear] = useState('');
  const [achievementDescription, setAchievementDescription] = useState('');
  const [editingAchievementId, setEditingAchievementId] = useState(null);
  const [editAchievementTitle, setEditAchievementTitle] = useState('');
  const [editAchievementYear, setEditAchievementYear] = useState('');
  const [editAchievementDescription, setEditAchievementDescription] = useState('');
  const [achievementFile, setAchievementFile] = useState(null);
  

  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [skillDetails, setSkillDetails] = useState('');
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editSkillName, setEditSkillName] = useState('');
  const [editSkillLevel, setEditSkillLevel] = useState('');
  const [editSkillDetails, setEditSkillDetails] = useState('');

  const [workExpTitle, setWorkExpTitle] = useState('');
  const [workExpPeriod, setWorkExpPeriod] = useState('');
  const [workExpCompany, setWorkExpCompany] = useState('');
  const [editingWorkExpId, setEditingWorkExpId] = useState(null);
  const [editWorkExpTitle, setEditWorkExpTitle] = useState('');
  const [editWorkExpPeriod, setEditWorkExpPeriod] = useState('');
  const [editWorkExpCompany, setEditWorkExpCompany] = useState('');

  const [messageFilter, setMessageFilter] = useState('');

  const [newSpecialization, setNewSpecialization] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newAward, setNewAward] = useState('');
  const [awardFile, setAwardFile] = useState(null);

  const [editingSpecId, setEditingSpecId] = useState(null);
  const [editSpecText, setEditSpecText] = useState('');
  const [editingEduId, setEditingEduId] = useState(null);
  const [editEduText, setEditEduText] = useState('');
  const [editingAwardId, setEditingAwardId] = useState(null);
  const [editAwardText, setEditAwardText] = useState('');

  const { data: profileDoc } = useFirestoreDoc({ db, path: ['settings', 'profile'], defaultValue: null });
  const { data: heroDoc } = useFirestoreDoc({ db, path: ['settings', 'hero'], defaultValue: null });
  const { data: resumeDoc } = useFirestoreDoc({ db, path: ['settings', 'resume'], defaultValue: null });
  const { data: sectionVisibilityDoc } = useFirestoreDoc({
    db,
    path: ['settings', 'sectionVisibility'],
    defaultValue: DEFAULT_SECTION_VISIBILITY,
  });

  const { data: projectsData } = useFirestoreCollection({ db, collectionPath: 'projects', orderField: 'order', defaultValue: [] });
  const { data: messages } = useFirestoreCollection({
    db,
    collectionPath: 'messages',
    orderField: 'createdAt',
    orderDirection: 'desc',
    defaultValue: [],
  });
  const { data: achievementsData } = useFirestoreCollection({ db, collectionPath: 'achievements', orderField: 'order', defaultValue: [] });
  const { data: skillsData } = useFirestoreCollection({ db, collectionPath: 'skills', orderField: 'order', defaultValue: [] });
  const { data: workExperienceData } = useFirestoreCollection({ db, collectionPath: 'workExperience', orderField: 'order', defaultValue: [] });
  const { data: specializationData } = useFirestoreCollection({ db, collectionPath: 'specialization', orderField: 'order', defaultValue: [] });
  const { data: educationData } = useFirestoreCollection({ db, collectionPath: 'education', orderField: 'order', defaultValue: [] });
  const { data: awardsData } = useFirestoreCollection({ db, collectionPath: 'awards', orderField: 'order', defaultValue: [] });

  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [skills, setSkills] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [specializationItems, setSpecializationItems] = useState([]);
  const [educationItems, setEducationItems] = useState([]);
  const [awardsItems, setAwardsItems] = useState([]);

  useEffect(() => setProjects(projectsData), [projectsData]);
  useEffect(() => setAchievements(achievementsData), [achievementsData]);
  useEffect(() => setSkills(skillsData), [skillsData]);
  useEffect(() => setWorkExperience(workExperienceData), [workExperienceData]);
  useEffect(() => setSpecializationItems(specializationData), [specializationData]);
  useEffect(() => setEducationItems(educationData), [educationData]);
  useEffect(() => setAwardsItems(awardsData), [awardsData]);

  useEffect(() => {
    setSectionVisibility(mergeVisibility(sectionVisibilityDoc));
  }, [sectionVisibilityDoc]);

  useEffect(() => {
    setProfileName(profileDoc?.name || '');
    setProfileBio(profileDoc?.bio || '');
    const currentProfileUrl = profileDoc?.imageUrl || auth.currentUser?.photoURL || '';
    setProfileUrl(currentProfileUrl);
    setProfileUrlInput(currentProfileUrl);
  }, [profileDoc]);

  useEffect(() => {
    setHeroUrl(heroDoc?.imageUrl || '');
  }, [heroDoc]);

  useEffect(() => {
    setResumeUrl(resumeDoc?.fileUrl || '');
  }, [resumeDoc]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    let mounted = true;

    const checkCurrentUser = async (user) => {
      setCheckingAdmin(true);
      const allowed = await isUserAdmin(db, user);
      if (!mounted) return;
      setIsAdminUser(allowed);
      setCheckingAdmin(false);
    };

    const unsub = onIdTokenChanged(auth, checkCurrentUser);
    checkCurrentUser(auth.currentUser);

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  const setError = (err, fallback = 'Operation failed') => {
    setStatus(err?.message ? `${fallback}: ${err.message}` : fallback);
  };

  const onDragStart = (e, id) => e.dataTransfer.setData('text/plain', id);
  const onDragOver = (e) => e.preventDefault();

  const saveSectionVisibility = async (sectionKey, key, value) => {
    const next = {
      ...sectionVisibility,
      [sectionKey]: { ...(sectionVisibility[sectionKey] || {}), [key]: value },
    };
    setSectionVisibility(next);
    try {
      await saveSettingsDoc(db, 'sectionVisibility', next);
      setStatus('Visibility updated');
    } catch (err) {
      setError(err, 'Failed to save visibility');
      setSectionVisibility(mergeVisibility(sectionVisibilityDoc));
    }
  };

  const renderVisibilityToggles = (sectionKey, label, options = {}) => {
    const { showResumeToggle = true } = options;
    const vis = sectionVisibility[sectionKey] || {};
    return (
      <div className="glass admin-visibility" role="group" aria-label={`${label || sectionKey} visibility`}>
        <span className="admin-visibility-label">{label || sectionKey}:</span>
        <label className="admin-visibility-toggle">
          <input
            type="checkbox"
            checked={vis.showOnSite !== false}
            onChange={(e) => saveSectionVisibility(sectionKey, 'showOnSite', e.target.checked)}
          />
          Show on site
        </label>
        {showResumeToggle && (
          <label className="admin-visibility-toggle">
            <input
              type="checkbox"
              checked={vis.showOnResume !== false}
              onChange={(e) => saveSectionVisibility(sectionKey, 'showOnResume', e.target.checked)}
            />
            Show on Resume
          </label>
        )}
      </div>
    );
  };

  const saveProfileInfo = async () => {
    setLoading(true);
    try {
      await saveSettingsDoc(db, 'profile', {
        name: profileName.trim(),
        bio: profileBio.trim(),
      });
      setStatus('Profile info saved');
    } catch (err) {
      setError(err, 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const setProfileImage = async () => {
    if (!profileUrlInput?.trim()) return setStatus('Please provide profile image URL');
    setLoading(true);
    try {
      const normalized = normalizeImageUrl(profileUrlInput.trim());
      if (!normalized) {
        setStatus('Please provide a valid image URL');
        return;
      }

      let finalProfileImageUrl = normalized;
      try {
        const parsed = new URL(normalized);
        if (
          parsed.hostname === 'github.com'
          || parsed.hostname === 'raw.githubusercontent.com'
          || parsed.hostname === 'cdn.jsdelivr.net'
          || parsed.hostname.endsWith('githubusercontent.com')
        ) {
          parsed.searchParams.set('v', String(Date.now()));
          finalProfileImageUrl = parsed.toString();
        }
      } catch (_) {
      }

      const reachable = await checkImageReachable(finalProfileImageUrl);
      if (!reachable) {
        setStatus('Image link saved, but preview verification failed. If image does not show publicly, use a direct public GitHub raw/jsDelivr URL.');
      }

      await saveSettingsDoc(db, 'profile', { imageUrl: finalProfileImageUrl });

      if (auth.currentUser) {
        try {
          await setProfileImageService({ auth, db, normalizedUrl: finalProfileImageUrl });
        } catch (_) {
        }
      }

      setStatus('Profile image saved');
      setProfileUrl(finalProfileImageUrl);
      setProfileUrlInput(finalProfileImageUrl);
      setPreviewError(false);
    } catch (err) {
      setError(err, 'Failed to set profile image');
    } finally {
      setLoading(false);
    }
  };

  const removeProfileImage = async () => {
    setLoading(true);
    try {
      await saveSettingsDoc(db, 'profile', { imageUrl: null });

      if (auth.currentUser) {
        try {
          await setProfileImageService({ auth, db, normalizedUrl: '' });
        } catch (_) {
        }
      }

      setProfileUrl('');
      setProfileUrlInput('');
      setPreviewError(false);
      setStatus('Profile image link removed');
    } catch (err) {
      setError(err, 'Failed to remove profile image link');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file, target) => {
    if (!file) return setStatus('No file selected');
    if (!auth.currentUser) return setStatus('Sign in as admin to upload files');

    setUploading(true);
    setUploadProgress(0);

    try {
      // Prefer Cloudinary; fallback to Firebase Storage if Cloudinary not configured
      let url;
      try {
        url = await uploadFileToCloudinary({ file, onProgress: setUploadProgress });
      } catch (err) {
        url = await uploadFileToStorage({ storage, file, subpath: target, onProgress: setUploadProgress });
      }

      if (target === 'profile') {
        await saveSettingsDoc(db, 'profile', { imageUrl: url });
        if (auth.currentUser) {
          try {
            await setProfileImageService({ auth, db, normalizedUrl: url });
          } catch (_) {
          }
        }
        setProfileUrl(url);
        setProfileUrlInput(url);
      }
      if (target === 'hero') {
        await saveSettingsDoc(db, 'hero', { imageUrl: url });
        setHeroUrl(url);
      }
      if (target === 'resume') {
        await saveSettingsDoc(db, 'resume', { fileUrl: url, name: file.name });
        setResumeUrl(url);
      }

      setStatus('Upload complete');
    } catch (err) {
      setError(err, 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadAssetWithFallback = async (file, subpath) => {
    if (!file) throw new Error('No file selected');

    setUploading(true);
    setUploadProgress(0);

    try {
      return await uploadFileToCloudinary({ file, onProgress: setUploadProgress });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onSaveHero = async () => {
    if (!heroUrl.trim()) return setStatus('Please provide hero image URL');
    setLoading(true);
    try {
      const normalized = normalizeImageUrl(heroUrl.trim());
      await saveSettingsDoc(db, 'hero', { imageUrl: normalized });
      setHeroUrl(normalized);
      setHeroPreviewError(false);
      setStatus('Hero image saved');
    } catch (err) {
      setError(err, 'Failed to save hero image');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!title.trim() || !category.trim()) return setStatus('Please fill title and category');
    setLoading(true);
    try {
      let imageUrl = projectImageUrl.trim() ? normalizeImageUrl(projectImageUrl.trim()) : null;
      if (projectImageFile) {
        imageUrl = await uploadAssetWithFallback(projectImageFile, 'projects');
      }

      await addOrderedItem(db, 'projects', {
        title: title.trim(),
        category: category.trim(),
        description: projectDescription.trim() || null,
        technologies: projectTechnologies.trim() || null,
        imageUrl: imageUrl || null,
        liveUrl: projectLink.trim() || null,
        repoUrl: projectRepoLink.trim() || null,
      }, projects.length);
      setTitle('');
      setCategory('');
      setProjectDescription('');
      setProjectTechnologies('');
      setProjectImageUrl('');
      setProjectLink('');
      setProjectRepoLink('');
      setProjectImageFile(null);
      setStatus('Project added');
    } catch (err) {
      setError(err, 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const startEditProject = (item) => {
    setEditingProjectId(item.id);
    setEditTitle(item.title || '');
    setEditCategory(item.category || '');
    setEditProjectDescription(item.description || '');
    setEditProjectTechnologies(item.technologies || '');
    setEditProjectImageUrl(item.imageUrl || '');
    setEditProjectLink(item.link || item.liveUrl || '');
    setEditProjectRepoLink(item.repoUrl || '');
    setEditProjectImageFile(null);
  };

  const cancelEditProject = () => {
    setEditingProjectId(null);
    setEditTitle('');
    setEditCategory('');
    setEditProjectDescription('');
    setEditProjectTechnologies('');
    setEditProjectImageUrl('');
    setEditProjectLink('');
    setEditProjectRepoLink('');
  };

  const saveEditedProject = async () => {
    if (!editingProjectId) return;
    if (!editTitle.trim()) return setStatus('Project title is required');
    setLoading(true);
    try {
      const currentProject = projects.find((item) => item.id === editingProjectId);
      let imageUrl = editProjectImageUrl.trim() ? normalizeImageUrl(editProjectImageUrl.trim()) : currentProject?.imageUrl || null;
      if (editProjectImageFile) {
        imageUrl = await uploadAssetWithFallback(editProjectImageFile, 'projects');
      }

      await updateItem(db, 'projects', editingProjectId, {
        title: editTitle.trim(),
        category: editCategory.trim() || null,
        description: editProjectDescription.trim() || null,
        technologies: editProjectTechnologies.trim() || null,
        order: Number.isInteger(currentProject?.order) ? currentProject.order : null,
        imageUrl: imageUrl ? imageUrl : null,
        liveUrl: editProjectLink.trim() || null,
        repoUrl: editProjectRepoLink.trim() || null,
      });
      cancelEditProject();
      setStatus('Project updated');
    } catch (err) {
      setError(err, 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    setLoading(true);
    try {
      await removeItem(db, 'projects', id);
      setStatus('Project deleted');
    } catch (err) {
      setError(err, 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const addAchievement = async () => {
    if (!achievementTitle.trim()) return setStatus('Please enter achievement title');
    setLoading(true);
    try {
      let imageUrl = null;
      if (achievementFile) {
        imageUrl = await uploadAssetWithFallback(achievementFile, 'achievements');
      }
      await addOrderedItem(db, 'achievements', {
        title: achievementTitle.trim(),
        year: achievementYear.trim() || null,
        description: achievementDescription.trim() || null,
        imageUrl: imageUrl || null,
      }, achievements.length);
      setAchievementTitle('');
      setAchievementYear('');
      setAchievementDescription('');
      setAchievementFile(null);
      setStatus('Achievement added');
    } catch (err) {
      setError(err, 'Failed to add achievement');
    } finally {
      setLoading(false);
    }
  };

  const startEditAchievement = (item) => {
    setEditingAchievementId(item.id);
    setEditAchievementTitle(item.title || '');
    setEditAchievementYear(item.year || '');
    setEditAchievementDescription(item.description || '');
  };

  const cancelEditAchievement = () => {
    setEditingAchievementId(null);
    setEditAchievementTitle('');
    setEditAchievementYear('');
    setEditAchievementDescription('');
  };

  const saveEditedAchievement = async () => {
    if (!editingAchievementId) return;
    setLoading(true);
    try {
      await updateItem(db, 'achievements', editingAchievementId, {
        title: editAchievementTitle.trim(),
        year: editAchievementYear.trim() || null,
        description: editAchievementDescription.trim() || null,
      });
      cancelEditAchievement();
      setStatus('Achievement updated');
    } catch (err) {
      setError(err, 'Failed to update achievement');
    } finally {
      setLoading(false);
    }
  };

  const deleteAchievement = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    setLoading(true);
    try {
      await removeItem(db, 'achievements', id);
      setStatus('Achievement deleted');
    } catch (err) {
      setError(err, 'Failed to delete achievement');
    } finally {
      setLoading(false);
    }
  };

  const onAchievementDrop = async (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;
    const updated = moveItem(achievements, draggedId, targetId);
    setAchievements(updated);
    try {
      await reorderItems(db, 'achievements', updated.map((x) => x.id));
      setStatus('Achievements order saved');
    } catch (err) {
      setError(err, 'Failed to save achievements order');
      setAchievements(achievementsData);
    }
  };

  const addSkill = async () => {
    if (!skillName.trim()) return setStatus('Please enter skill name');
    setLoading(true);
    try {
      await addOrderedItem(db, 'skills', {
        name: skillName.trim(),
        level: skillLevel.trim() || null,
        details: skillDetails.trim() || null,
      }, skills.length);
      setSkillName('');
      setSkillLevel('');
      setSkillDetails('');
      setStatus('Skill added');
    } catch (err) {
      setError(err, 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const startEditSkill = (item) => {
    setEditingSkillId(item.id);
    setEditSkillName(item.name || '');
    setEditSkillLevel(item.level || '');
    setEditSkillDetails(item.details || '');
  };

  const cancelEditSkill = () => {
    setEditingSkillId(null);
    setEditSkillName('');
    setEditSkillLevel('');
    setEditSkillDetails('');
  };

  const saveEditedSkill = async () => {
    if (!editingSkillId) return;
    setLoading(true);
    try {
      await updateItem(db, 'skills', editingSkillId, {
        name: editSkillName.trim(),
        level: editSkillLevel.trim() || null,
        details: editSkillDetails.trim() || null,
      });
      cancelEditSkill();
      setStatus('Skill updated');
    } catch (err) {
      setError(err, 'Failed to update skill');
    } finally {
      setLoading(false);
    }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    setLoading(true);
    try {
      await removeItem(db, 'skills', id);
      setStatus('Skill deleted');
    } catch (err) {
      setError(err, 'Failed to delete skill');
    } finally {
      setLoading(false);
    }
  };

  const onSkillDrop = async (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;
    const updated = moveItem(skills, draggedId, targetId);
    setSkills(updated);
    try {
      await reorderItems(db, 'skills', updated.map((x) => x.id));
      setStatus('Skills order saved');
    } catch (err) {
      setError(err, 'Failed to save skills order');
      setSkills(skillsData);
    }
  };

  const addWorkExperience = async () => {
    if (!workExpTitle.trim()) return setStatus('Please enter work experience title');
    setLoading(true);
    try {
      await addOrderedItem(db, 'workExperience', {
        title: workExpTitle.trim(),
        period: workExpPeriod.trim() || null,
        company: workExpCompany.trim() || null,
      }, workExperience.length);
      setWorkExpTitle('');
      setWorkExpPeriod('');
      setWorkExpCompany('');
      setStatus('Work experience added');
    } catch (err) {
      setError(err, 'Failed to add work experience');
    } finally {
      setLoading(false);
    }
  };

  const startEditWorkExperience = (item) => {
    setEditingWorkExpId(item.id);
    setEditWorkExpTitle(item.title || item.name || item.text || '');
    setEditWorkExpPeriod(item.period || item.year || '');
    setEditWorkExpCompany(item.company || '');
  };

  const cancelEditWorkExperience = () => {
    setEditingWorkExpId(null);
    setEditWorkExpTitle('');
    setEditWorkExpPeriod('');
    setEditWorkExpCompany('');
  };

  const saveEditedWorkExperience = async () => {
    if (!editingWorkExpId) return;
    setLoading(true);
    try {
      await updateItem(db, 'workExperience', editingWorkExpId, {
        title: editWorkExpTitle.trim(),
        period: editWorkExpPeriod.trim() || null,
        company: editWorkExpCompany.trim() || null,
      });
      cancelEditWorkExperience();
      setStatus('Work experience updated');
    } catch (err) {
      setError(err, 'Failed to update work experience');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkExperience = async (id) => {
    if (!window.confirm('Delete this work experience?')) return;
    setLoading(true);
    try {
      await removeItem(db, 'workExperience', id);
      setStatus('Work experience deleted');
    } catch (err) {
      setError(err, 'Failed to delete work experience');
    } finally {
      setLoading(false);
    }
  };

  const onWorkExpDrop = async (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;
    const updated = moveItem(workExperience, draggedId, targetId);
    setWorkExperience(updated);
    try {
      await reorderItems(db, 'workExperience', updated.map((x) => x.id));
      setStatus('Work experience order saved');
    } catch (err) {
      setError(err, 'Failed to save work experience order');
      setWorkExperience(workExperienceData);
    }
  };

  const addListItem = async (collectionName, text, currentLength) => {
    if (!text.trim()) return setStatus('Please enter text');
    setLoading(true);
    try {
      await addOrderedItem(db, collectionName, { text: text.trim() }, currentLength);
      if (collectionName === 'specialization') setNewSpecialization('');
      if (collectionName === 'education') setNewEducation('');
      if (collectionName === 'awards') setNewAward('');
      setStatus('Item added');
    } catch (err) {
      setError(err, 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const saveEditedListItem = async (collectionName, id, newText) => {
    if (!id || !newText.trim()) return setStatus('Text is required');
    setLoading(true);
    try {
      await updateItem(db, collectionName, id, { text: newText.trim() });
      if (collectionName === 'specialization') { setEditingSpecId(null); setEditSpecText(''); }
      if (collectionName === 'education') { setEditingEduId(null); setEditEduText(''); }
      if (collectionName === 'awards') { setEditingAwardId(null); setEditAwardText(''); }
      setStatus('Item updated');
    } catch (err) {
      setError(err, 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const deleteListItem = async (collectionName, id) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    try {
      await removeItem(db, collectionName, id);
      setStatus('Item deleted');
    } catch (err) {
      setError(err, 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const onListDrop = async (e, targetId, collectionName, items, setItems) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;
    const updated = moveItem(items, draggedId, targetId);
    setItems(updated);
    try {
      await reorderItems(db, collectionName, updated.map((x) => x.id));
      setStatus('Order saved');
    } catch (err) {
      setError(err, 'Failed to save order');
      if (collectionName === 'specialization') setSpecializationItems(specializationData);
      if (collectionName === 'education') setEducationItems(educationData);
      if (collectionName === 'awards') setAwardsItems(awardsData);
    }
  };

  const toggleMessageRead = async (id, read) => {
    try {
      await updateItem(db, 'messages', id, { read: !!read });
    } catch (err) {
      setError(err, 'Failed to update message status');
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(messages.filter((m) => !m.read).map((m) => updateItem(db, 'messages', m.id, { read: true })));
      setStatus('All messages marked read');
    } catch (err) {
      setError(err, 'Failed to mark all as read');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await removeItem(db, 'messages', id);
      setStatus('Message deleted');
    } catch (err) {
      setError(err, 'Failed to delete message');
    }
  };

  const exportMessagesCSV = () => {
    if (!messages.length) return setStatus('No messages to export');
    const rows = [['Name', 'Email', 'Message', 'Read', 'Created At']];
    messages.forEach((m) => {
      rows.push([
        m.name || '',
        m.email || '',
        (m.message || '').replace(/\n/g, ' '),
        m.read ? 'yes' : 'no',
        m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : '',
      ]);
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messages.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (checkingAdmin) {
    return (
      <section className="admin-panel" style={{ padding: '60px 10%' }}>
        <h2>Admin Panel</h2>
        <div className="glass">Checking admin privileges…</div>
      </section>
    );
  }

  if (!isAdminUser) {
    return <AdminAccessDenied />;
  }

  const isErrorStatus = status && (status.toLowerCase().includes('failed') || status.toLowerCase().includes('error') || status.toLowerCase().includes('denied'));

  return (
    <section className="admin-panel" style={{ padding: '60px 10%' }}>
      <h2>Admin Panel</h2>
      {status && (
        <div className={isErrorStatus ? 'status error' : 'status success'} role="alert" style={{ marginBottom: 16 }}>
          {status}
        </div>
      )}

      <div className="glass">
        <div className="admin-tabs-wrap">
          <div className="tabs admin-tabs" role="tablist" aria-label="Admin sections">
            <button role="tab" aria-selected={activeTab === 'profile'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
            <button role="tab" aria-selected={activeTab === 'hero'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}>Hero</button>
            <button role="tab" aria-selected={activeTab === 'projects'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects</button>
            <button role="tab" aria-selected={activeTab === 'achievements'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>Achievements</button>
            <button role="tab" aria-selected={activeTab === 'skills'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
            <button role="tab" aria-selected={activeTab === 'workExperience'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'workExperience' ? 'active' : ''}`} onClick={() => setActiveTab('workExperience')}>Work Experience</button>
            <button role="tab" aria-selected={activeTab === 'resumeSections'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'resumeSections' ? 'active' : ''}`} onClick={() => setActiveTab('resumeSections')}>Resume Sections</button>
            <button role="tab" aria-selected={activeTab === 'messages'} aria-controls="admin-tabpanel" className={`btn tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
              Messages {unreadCount > 0 && <span className="badge">({unreadCount})</span>}
            </button>
          </div>
        </div>

        <div id="admin-tabpanel" className="admin-tab-content" role="tabpanel">
        {activeTab === 'profile' && (
          <AdminProfileTab
            visibilityNode={renderVisibilityToggles('skills', 'Profile visibility managed by related sections')}
            profileName={profileName}
            setProfileName={setProfileName}
            profileBio={profileBio}
            setProfileBio={setProfileBio}
            saveProfileInfo={saveProfileInfo}
            profileUrl={profileUrl}
            profileUrlInput={profileUrlInput}
            setProfileUrlInput={setProfileUrlInput}
            profileFile={profileFile}
            setProfileFile={setProfileFile}
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            resumeUrl={resumeUrl}
            uploading={uploading}
            uploadProgress={uploadProgress}
            previewError={previewError}
            setPreviewError={setPreviewError}
            setProfileImage={setProfileImage}
            removeProfileImage={removeProfileImage}
            uploadImage={uploadImage}
            normalizeImageUrl={normalizeImageUrl}
            status={status}
          />
        )}

        {activeTab === 'hero' && (
          <AdminHeroTab
            visibilityNode={renderVisibilityToggles('projects', 'Hero shows project highlights')}
            heroUrl={heroUrl}
            setHeroUrl={setHeroUrl}
            heroFile={heroFile}
            setHeroFile={setHeroFile}
            uploading={uploading}
            uploadProgress={uploadProgress}
            heroPreviewError={heroPreviewError}
            setHeroPreviewError={setHeroPreviewError}
            onSaveHero={onSaveHero}
            uploadImage={uploadImage}
            normalizeImageUrl={normalizeImageUrl}
          />
        )}

        {activeTab === 'projects' && (
          <AdminProjectsTab
            visibilityNode={renderVisibilityToggles('projects', 'Projects')}
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            projectImageUrl={projectImageUrl}
            setProjectImageUrl={setProjectImageUrl}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            projectTechnologies={projectTechnologies}
            setProjectTechnologies={setProjectTechnologies}
            projectImageFile={projectImageFile}
            setProjectImageFile={setProjectImageFile}
            projectLink={projectLink}
            setProjectLink={setProjectLink}
            projectRepoLink={projectRepoLink}
            setProjectRepoLink={setProjectRepoLink}
            projects={projects}
            loading={loading}
            editingProjectId={editingProjectId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editCategory={editCategory}
            setEditCategory={setEditCategory}
            editProjectDescription={editProjectDescription}
            setEditProjectDescription={setEditProjectDescription}
            editProjectTechnologies={editProjectTechnologies}
            setEditProjectTechnologies={setEditProjectTechnologies}
            editProjectImageUrl={editProjectImageUrl}
            setEditProjectImageUrl={setEditProjectImageUrl}
            editProjectImageFile={editProjectImageFile}
            setEditProjectImageFile={setEditProjectImageFile}
            editProjectLink={editProjectLink}
            setEditProjectLink={setEditProjectLink}
            editProjectRepoLink={editProjectRepoLink}
            setEditProjectRepoLink={setEditProjectRepoLink}
            addProject={addProject}
            startEditProject={startEditProject}
            cancelEditProject={cancelEditProject}
            saveEditedProject={saveEditedProject}
            deleteProject={deleteProject}
            onProjectDragStart={onDragStart}
            onProjectDragOver={onDragOver}
            onProjectDrop={onProjectDrop}
          />
        )}

        {activeTab === 'achievements' && (
          <AdminAchievementsTab
            visibilityNode={renderVisibilityToggles('achievements', 'Achievements')}
            achievementTitle={achievementTitle}
            setAchievementTitle={setAchievementTitle}
            achievementYear={achievementYear}
            setAchievementYear={setAchievementYear}
            achievementDescription={achievementDescription}
            setAchievementDescription={setAchievementDescription}
            achievements={achievements}
            loading={loading}
            editingAchievementId={editingAchievementId}
            editAchievementTitle={editAchievementTitle}
            setEditAchievementTitle={setEditAchievementTitle}
            editAchievementYear={editAchievementYear}
            setEditAchievementYear={setEditAchievementYear}
            editAchievementDescription={editAchievementDescription}
            setEditAchievementDescription={setEditAchievementDescription}
            addAchievement={addAchievement}
            startEditAchievement={startEditAchievement}
            cancelEditAchievement={cancelEditAchievement}
            saveEditedAchievement={saveEditedAchievement}
            deleteAchievement={deleteAchievement}
            onAchievementDragStart={onDragStart}
            onAchievementDragOver={onDragOver}
            onAchievementDrop={onAchievementDrop}
            achievementFile={achievementFile}
            setAchievementFile={setAchievementFile}
            onAchievementFileChange={(file) => setAchievementFile(file)}
          />
        )}

        {activeTab === 'skills' && (
          <AdminSkillsTab
            visibilityNode={renderVisibilityToggles('skills', 'Skills')}
            skillName={skillName}
            setSkillName={setSkillName}
            skillLevel={skillLevel}
            setSkillLevel={setSkillLevel}
            skillDetails={skillDetails}
            setSkillDetails={setSkillDetails}
            skills={skills}
            loading={loading}
            editingSkillId={editingSkillId}
            editSkillName={editSkillName}
            setEditSkillName={setEditSkillName}
            editSkillLevel={editSkillLevel}
            setEditSkillLevel={setEditSkillLevel}
            editSkillDetails={editSkillDetails}
            setEditSkillDetails={setEditSkillDetails}
            addSkill={addSkill}
            startEditSkill={startEditSkill}
            cancelEditSkill={cancelEditSkill}
            saveEditedSkill={saveEditedSkill}
            deleteSkill={deleteSkill}
            onSkillDragStart={onDragStart}
            onSkillDragOver={onDragOver}
            onSkillDrop={onSkillDrop}
          />
        )}

        {activeTab === 'workExperience' && (
          <AdminWorkExperienceTab
            visibilityNode={renderVisibilityToggles('workExperience', 'Work Experience')}
            workExpTitle={workExpTitle}
            setWorkExpTitle={setWorkExpTitle}
            workExpPeriod={workExpPeriod}
            setWorkExpPeriod={setWorkExpPeriod}
            workExpCompany={workExpCompany}
            setWorkExpCompany={setWorkExpCompany}
            workExperience={workExperience}
            loading={loading}
            editingWorkExpId={editingWorkExpId}
            editWorkExpTitle={editWorkExpTitle}
            setEditWorkExpTitle={setEditWorkExpTitle}
            editWorkExpPeriod={editWorkExpPeriod}
            setEditWorkExpPeriod={setEditWorkExpPeriod}
            editWorkExpCompany={editWorkExpCompany}
            setEditWorkExpCompany={setEditWorkExpCompany}
            addWorkExperience={addWorkExperience}
            startEditWorkExperience={startEditWorkExperience}
            cancelEditWorkExperience={cancelEditWorkExperience}
            saveEditedWorkExperience={saveEditedWorkExperience}
            deleteWorkExperience={deleteWorkExperience}
            onWorkExpDragStart={onDragStart}
            onWorkExpDragOver={onDragOver}
            onWorkExpDrop={onWorkExpDrop}
          />
        )}

        {activeTab === 'resumeSections' && (
          <AdminResumeSectionsTab
            resumeVisibilityNode={renderVisibilityToggles('resume', 'Resume', { showResumeToggle: false })}
            specializationVisibilityNode={renderVisibilityToggles('specialization', 'Specialization')}
            educationVisibilityNode={renderVisibilityToggles('education', 'Education')}
            awardsVisibilityNode={renderVisibilityToggles('awards', 'Scholarships & Awards')}
            specializationItems={specializationItems}
            newSpecialization={newSpecialization}
            setNewSpecialization={setNewSpecialization}
            editingSpecId={editingSpecId}
            setEditingSpecId={setEditingSpecId}
            editSpecText={editSpecText}
            setEditSpecText={setEditSpecText}
            educationItems={educationItems}
            newEducation={newEducation}
            setNewEducation={setNewEducation}
            editingEduId={editingEduId}
            setEditingEduId={setEditingEduId}
            editEduText={editEduText}
            setEditEduText={setEditEduText}
            awardsItems={awardsItems}
            newAward={newAward}
            setNewAward={setNewAward}
            editingAwardId={editingAwardId}
            setEditingAwardId={setEditingAwardId}
            editAwardText={editAwardText}
            setEditAwardText={setEditAwardText}
            addListItem={addListItem}
            saveEditedListItem={saveEditedListItem}
            deleteListItem={deleteListItem}
            onListDragStart={onDragStart}
            onListDragOver={onDragOver}
            onListDrop={onListDrop}
            fetchSpecialization={() => {}}
            fetchEducation={() => {}}
            fetchAwards={() => {}}
            setSpecializationItems={setSpecializationItems}
            setEducationItems={setEducationItems}
            setAwardsItems={setAwardsItems}
            awardFile={awardFile}
            setAwardFile={setAwardFile}
            onAddAward={async () => {
              if (!newAward.trim()) return setStatus('Please enter text for award');
              setLoading(true);
              try {
                let imageUrl = null;
                if (awardFile) {
                  imageUrl = await uploadAssetWithFallback(awardFile, 'awards');
                }
                await addOrderedItem(db, 'awards', { text: newAward.trim(), imageUrl: imageUrl }, awardsItems.length);
                setNewAward('');
                setAwardFile(null);
                setStatus('Award added');
              } catch (err) {
                setError(err, 'Failed to add award');
              } finally {
                setLoading(false);
                setUploadProgress(0);
              }
            }}
          />
        )}

        {activeTab === 'messages' && (
          <AdminMessagesTab
            messages={messages}
            messageFilter={messageFilter}
            setMessageFilter={setMessageFilter}
            loading={loading}
            exportMessagesCSV={exportMessagesCSV}
            markAllRead={markAllRead}
            toggleMessageRead={toggleMessageRead}
            deleteMessage={deleteMessage}
          />
        )}
        </div>
      </div>
    </section>
  );
}

export default Admin;
