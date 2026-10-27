'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Activity, BookOpen, CalendarDays, Check, CheckSquare, ChevronDown, Clock, Computer, Globe2, GraduationCap, LayoutDashboard, LogOut, Menu, Monitor, Pencil, Plus, Search, Settings, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import StudentTable from '@/components/StudentTable';
import ImportExcel from '@/components/ImportExcel';
import { addStudent } from '@/actions/studentActions';
import { addSession, deleteSession } from '@/actions/sessionActions'; 
import { saveAttendance } from '@/actions/attendanceActions';
import { createTeacher, getTeachers } from '@/actions/adminActions';
import { createEvaluation, saveGrades } from '@/actions/gradeActions';

type Lang = 'fr' | 'ar';
type Profile = { full_name: string; role: 'admin' | 'teacher' };
type SchoolClass = { id: string; name: string; level: string; school_year: string; created_at?: string; created_by?: string };
type Student = { id: string; first_name: string; last_name: string; group: string; class_id: string };
type Session = { id: string; class_id: string; title: string; session_date: string; start_time: string; end_time: string; created_at: string };
type AttendanceRecord = { student_id: string; status: string; first_name: string; last_name: string };
type Evaluation = { id: string; class_id: string; title: string; date_eval: string };
type Grade = { id: string; evaluation_id: string; student_id: string; score: number };
type ComputerAssignment = { computer_number: number; student_id: string };

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const copy = {
 fr: { 
   dashboard:'Tableau de bord', classes:'Classes & élèves', sessions:'Séances', attendance:'Appel / Présences', grades:'Notes & devoirs', computers:'Postes informatiques', history:'Historique', settings:'Paramètres', search:'Rechercher…', schoolYear:'Année scolaire', welcome:'Bonjour !', overview:'Voici le résumé de votre laboratoire.', classesCount:'Classes', studentsCount:'Élèves', sessionsCount:'Séances', computersCount:'Postes informatiques', attendanceRate:'Présence moyenne', quick:'Accès rapide', addClass:'Ajouter une classe', newSession:'Créer une séance', takeAttendance:'Faire l’appel', manageComputers:'Gérer les postes', recent:'Classes récentes', className:'Nom de la classe', level:'Niveau / filière', year:'Année scolaire', save:'Enregistrer', cancel:'Annuler', login:'Connexion', email:'Adresse e-mail', password:'Mot de passe', signIn:'Se connecter', signingIn:'Connexion…', logout:'Déconnexion', noClasses:'Aucune classe pour le moment.', configure:'Configurez Supabase pour activer les données en ligne.', loadError:'Impossible de charger les données.', addSuccess:'Classe ajoutée.', error:'Une erreur est survenue.', roleAdmin:'Administration', roleTeacher:'Enseignant', language:'Langue', adminOnly:'Certains réglages sont réservés à l’administration.', noAccount:'Le compte doit être créé ou invité par l’administration.', emptyFields:'Veuillez remplir tous les champs.',
   studentsList:'Liste des élèves', backToClasses:'← Retour aux classes', addStudent:'Ajouter un élève', firstName:'Prénom', lastName:'Nom', group:'Groupe', addBtn:'+ Ajouter',
   sessionsList:'Liste des séances', addSessionBtn:'+ Planifier une séance', sessionTitle:'Titre de la séance', sessionDate:'Date', sessionStart:'Heure de début', sessionEnd:'Heure de fin', sessionClass:'Classe', noSessions:'Aucune séance planifiée pour le moment.', actionDelete:'Supprimer',
   attendanceTitle: 'Faire l\'appel', backToSessions: '← Retour aux séances', saveAttendance: 'Enregistrer l\'appel', present: 'Présent', absent: 'Absent', noStudentsInClass: 'Aucun élève dans cette classe.',
   adminSettingsTitle: 'Ajouter un enseignant', adminSettingsDesc: 'Créez un compte pour un nouveau professeur. Il pourra se connecter avec ces identifiants.', teacherName: 'Nom', teacherFirstName: 'Prénom', teacherEmail: 'Adresse e-mail', teacherPassword: 'Mot de passe', createTeacherBtn: '+ Créer le compte', restrictedAccess: 'Accès restreint', restrictedDesc: 'Seul le Super Administrateur peut ajouter de nouveaux enseignants.', teachersList: 'Liste des enseignants', idUser: 'ID Utilisateur', role: 'Rôle', dateCreated: 'Date de création', noTeachers: 'Aucun enseignant pour le moment.',
   gradesTitle: 'Notes & Devoirs', addEval: 'Créer une évaluation', evalTitle: 'Titre du devoir', evalClass: 'Classe', evalDate: 'Date', evalBtn: 'Créer', noEvals: 'Aucune évaluation pour le moment.', enterGrades: 'Saisie des notes', backToEvals: '← Retour aux évaluations', saveGrades: 'Enregistrer les notes', score: 'Note / 20',
   forgotPassword: 'Mot de passe oublié ?', resetPassword: 'Mot de passe oublié', resetDesc: 'Entrez votre adresse email pour recevoir un lien de réinitialisation.', sendLink: 'Envoyer le lien', backToLogin: '← Retour à la connexion', emailSent: 'Un email de récupération vous a été envoyé !'
 },
 ar: { 
   dashboard:'لوحة القيادة', classes:'الأقسام والتلاميذ', sessions:'الحصص', attendance:'الحضور والغياب', grades:'الأعداد والفروض', computers:'الحواسيب', history:'السجل', settings:'الإعدادات', search:'بحث…', schoolYear:'السنة الدراسية', welcome:'مرحباً!', overview:'إليك ملخص مخبر الإعلامية.', classesCount:'الأقسام', studentsCount:'التلاميذ', sessionsCount:'الحصص', computersCount:'الحواسيب', attendanceRate:'معدل الحضور', quick:'وصول سريع', addClass:'إضافة قسم', newSession:'إنشاء حصة', takeAttendance:'تسجيل الحضور', manageComputers:'إدارة الحواسيب', recent:'الأقسام الأخيرة', className:'اسم القسم', level:'المستوى / الشعبة', year:'السنة الدراسية', save:'حفظ', cancel:'إلغاء', login:'تسجيل الدخول', email:'البريد الإلكتروني', password:'كلمة المرور', signIn:'دخول', signingIn:'جاري الدخول…', logout:'خروج', noClasses:'لا توجد أقسام حالياً.', configure:'قم بإعداد Supabase لتفعيل البيانات عبر الإنترنت.', loadError:'تعذر تحميل البيانات.', addSuccess:'تمت إضافة القسم.', error:'حدث خطأ.', roleAdmin:'الإدارة', roleTeacher:'أستاذ', language:'اللغة', adminOnly:'بعض الإعدادات متاحة للإدارة فقط.', noAccount:'يجب إنشاء الحساب أو دعوته من قبل الإدارة.', emptyFields:'يرجى ملء جميع الخانات.',
   studentsList:'قائمة التلاميذ', backToClasses:'← العودة للأقسام', addStudent:'إضافة تلميذ', firstName:'الاسم', lastName:'اللقب', group:'الفوج', addBtn:'+ إضافة',
   sessionsList:'قائمة الحصص', addSessionBtn:'+ برمجة حصة', sessionTitle:'عنوان الحصة', sessionDate:'التاريخ', sessionStart:'وقت البدء', sessionEnd:'وقت الانتهاء', sessionClass:'القسم', noSessions:'لا توجد حصص مبرمجة حالياً.', actionDelete:'حذف',
   attendanceTitle: 'تسجيل الحضور', backToSessions: '← العودة للحصص', saveAttendance: 'حفظ الحضور', present: 'حاضر', absent: 'غائب', noStudentsInClass: 'لا يوجد تلاميذ في هذا القسم.',
   adminSettingsTitle: 'إضافة أستاذ', adminSettingsDesc: 'أنشئ حساباً لأستاذ جديد. سيمكنه الدخول بهذه البيانات.', teacherName: 'اللقب', teacherFirstName: 'الاسم', teacherEmail: 'البريد الإلكتروني', teacherPassword: 'كلمة المرور', createTeacherBtn: '+ إنشاء الحساب', restrictedAccess: 'وصول مقيد', restrictedDesc: 'فقط المسؤول الأعلى يمكنه إضافة أساتذة جدد.', teachersList: 'قائمة الأساتذة', idUser: 'معرف المستخدم', role: 'الدور', dateCreated: 'تاريخ الإنشاء', noTeachers: 'لا يوجد أساتذة حالياً.',
   gradesTitle: 'الأعداد والفروض', addEval: 'إنشاء فرض', evalTitle: 'عنوان الفرض', evalClass: 'القسم', evalDate: 'التاريخ', evalBtn: 'إنشاء', noEvals: 'لا توجد فروض حالياً.', enterGrades: 'إدخال الأعداد', backToEvals: '← العودة للفروض', saveGrades: 'حفظ الأعداد', score: 'العدد / 20',
   forgotPassword: 'نسيت كلمة المرور؟', resetPassword: 'نسيت كلمة المرور', resetDesc: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين.', sendLink: 'إرسال الرابط', backToLogin: '← العودة لتسجيل الدخول', emailSent: 'تم إرسال رابط الاستعادة إلى بريدك!'
 }
};

const nav = [ ['dashboard', LayoutDashboard], ['classes', Users], ['sessions', CalendarDays], ['attendance', Check], ['grades', BookOpen], ['computers', Monitor], ['history', Activity], ['settings', Settings] ] as const;

export default function Home() {
 const router = useRouter();
 const [lang,setLang] = useState<Lang>('fr'); const t=copy[lang]; const rtl=lang==='ar';
 const [supabaseReady,setSupabaseReady]=useState(false); const [user,setUser]=useState<{email:string;id:string}|null>(null); const [profile,setProfile]=useState<Profile|null>(null);
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loginBusy,setLoginBusy]=useState(false); const [notice,setNotice]=useState('');
 
 const [isForgotPassword, setIsForgotPassword] = useState(false);

 // Données
 const [active,setActive]=useState('dashboard'); 
 const [classes,setClasses]=useState<SchoolClass[]>([]); 
 const [students,setStudents]=useState<Student[]>([]); 
 const [sessions,setSessions]=useState<Session[]>([]); 
 const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
 const [grades, setGrades] = useState<Grade[]>([]);
 const [computerAssignments, setComputerAssignments] = useState<ComputerAssignment[]>([]);
 const [loading,setLoading]=useState(false); 
 
 // Formulaires et UI
 const [showAdd,setShowAdd]=useState(false); 
 const [showAddSession,setShowAddSession]=useState(false); 
 const [showAddEval, setShowAddEval] = useState(false);
 const [className,setClassName]=useState(''); 
 const [level,setLevel]=useState('Secondaire'); 
 const [year,setYear]=useState('2026/2027'); 
 const [query,setQuery]=useState(''); 
 const [mobileNav,setMobileNav]=useState(false);
 const [selectedClassForStudents, setSelectedClassForStudents] = useState<string | null>(null);

 // États pour l'appel
 const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
 const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
 const [savingAttendance, setSavingAttendance] = useState(false);
 
 // État pour les notes
 const [selectedEvalForGrades, setSelectedEvalForGrades] = useState<string | null>(null);
 const [evalData, setEvalData] = useState<{ student_id: string, score: string | number, first_name: string, last_name: string }[]>([]);
 const [savingGrades, setSavingGrades] = useState(false);

 // État pour le formulaire admin
 const [creatingTeacher, setCreatingTeacher] = useState(false);
 const [teachersList, setTeachersList] = useState<any[]>([]);

 // État pour l'attribution des postes
 const [assigningPc, setAssigningPc] = useState<number | null>(null);

 const supabase=useMemo(()=>{try { return createClient(); } catch { return null; }},[]);
 
 useEffect(()=>{setSupabaseReady(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));},[]);
 
 useEffect(()=>{ 
   if(!supabase)return; 
   let mounted=true; 
   supabase.auth.getSession().then(({data})=>{if(mounted&&data.session){setUser({id:data.session.user.id,email:data.session.user.email??''});}}); 
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
     if(!mounted)return; 
     setUser(session?{id:session.user.id,email:session.user.email??''}:null); 
     if(!session){setProfile(null);setClasses([]);setStudents([]);setSessions([]);setEvaluations([]);setGrades([]);setComputerAssignments([]);}
   }); 
   return ()=>{mounted=false;subscription.unsubscribe();}; 
 },[supabase]);

 useEffect(()=>{
   if(!supabase||!user)return; 
   let cancelled=false; 
   (async()=>{
     setLoading(true); 
     
     const {data:prof} = await supabase.from('profiles').select('full_name,role').eq('id',user.id).maybeSingle();
     if(prof) setProfile(prof as Profile);
     
     const isAdminUser = prof?.role === 'admin' || user.email === 'ezzinemoez.dev@gmail.com';

     let classesQuery = supabase.from('classes').select('id,name,level,school_year,created_at,created_by').order('name');
     if (!isAdminUser) {
       classesQuery = classesQuery.eq('created_by', user.id);
     }
     const {data: cls} = await classesQuery;
     
     if(cancelled) return;
     if(cls) setClasses(cls as SchoolClass[]);
     
     const myClassIds = cls ? cls.map(c => c.id) : [];

     let finalStudents: Student[] = [];
     let finalSessions: Session[] = [];
     let finalEvals: Evaluation[] = [];
     let finalGrades: Grade[] = [];
     let finalComputers: ComputerAssignment[] = [];

     if (isAdminUser) {
       const [{data:stud},{data:sess},{data:evals},{data:grds}, {data:comps}] = await Promise.all([
         supabase.from('students').select('id,first_name,last_name,group,class_id').order('last_name'),
         supabase.from('sessions').select('*').order('session_date', { ascending: true }),
         supabase.from('evaluations').select('*').order('date_eval', { ascending: false }),
         supabase.from('grades').select('*'),
         supabase.from('computer_assignments').select('*')
       ]);
       if(stud) finalStudents = stud as Student[];
       if(sess) finalSessions = sess as Session[];
       if(evals) finalEvals = evals as Evaluation[];
       if(grds) finalGrades = grds as Grade[];
       if(comps) finalComputers = comps as ComputerAssignment[];
     } 
     else if (myClassIds.length > 0) {
       const [{data:stud},{data:sess},{data:evals},{data:grds}, {data:comps}] = await Promise.all([
         supabase.from('students').select('id,first_name,last_name,group,class_id').in('class_id', myClassIds).order('last_name'),
         supabase.from('sessions').select('*').in('class_id', myClassIds).order('session_date', { ascending: true }),
         supabase.from('evaluations').select('*').in('class_id', myClassIds).order('date_eval', { ascending: false }),
         supabase.from('grades').select('*'),
         supabase.from('computer_assignments').select('*')
       ]);
       if(stud) finalStudents = stud as Student[];
       if(sess) finalSessions = sess as Session[];
       if(evals) finalEvals = evals as Evaluation[];
       if(grds) finalGrades = grds as Grade[];
       if(comps) finalComputers = comps as ComputerAssignment[];
     }

     if(cancelled) return;
     setStudents(finalStudents);
     setSessions(finalSessions);
     setEvaluations(finalEvals);
     setGrades(finalGrades);
     setComputerAssignments(finalComputers);
     setLoading(false); 
   })(); 
   return ()=>{cancelled=true;}; 
 },[supabase,user]);

 const isAdmin=profile?.role==='admin';
 const isSuperAdmin = user?.email === 'ezzinemoez.dev@gmail.com' || isAdmin;

 useEffect(() => {
   if (active === 'settings' && isSuperAdmin) {
     getTeachers().then(res => {
       if (res.data) setTeachersList(res.data);
     });
   }
 }, [active, isSuperAdmin]);

 async function signIn(e:React.FormEvent){
   e.preventDefault();if(!supabase)return;setLoginBusy(true);setNotice('');
   const {error}=await supabase.auth.signInWithPassword({email,password});
   setLoginBusy(false);
   if(error)setNotice(error.message);else{setPassword('');setNotice('');}
 }

 async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
   e.preventDefault();
   if (!supabase) return;
   setLoginBusy(true);
   setNotice('');
   
   const formData = new FormData(e.currentTarget);
   const resetEmail = formData.get('reset_email') as string;

   const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
     redirectTo: `${window.location.origin}/update-password`,
   });

   setLoginBusy(false);
   if (error) {
     setNotice(error.message);
   } else {
     setNotice(t.emailSent);
     setIsForgotPassword(false);
   }
 }
 
 async function signOut(){if(supabase)await supabase.auth.signOut();}
 
 async function addClass(e:React.FormEvent){
   e.preventDefault();if(!supabase||!className.trim()){setNotice(t.emptyFields);return;} 
   const {data,error}=await supabase.from('classes').insert({
     name: className.trim(),
     level,
     school_year: year,
     created_by: user?.id 
   }).select('id,name,level,school_year,created_at,created_by').single();
   
   if(error){setNotice(error.message);return;}
   setClasses(old=>[...old,data as SchoolClass].sort((a,b)=>a.name.localeCompare(b.name)));
   setClassName('');setShowAdd(false);setNotice(t.addSuccess);
 }

 async function handleAddStudent(formData: FormData) {
   if (!selectedClassForStudents) return;
   const result = await addStudent(selectedClassForStudents, formData);
   if (result.error) alert(result.error);
   else window.location.reload(); 
 }

 async function handleAddSession(formData: FormData) {
   const result = await addSession(formData);
   if (result.error) alert(result.error);
   else {
     setShowAddSession(false);
     window.location.reload();
   }
 }

 async function handleDeleteSession(id: string) {
   if (confirm('Voulez-vous vraiment supprimer cette séance ?')) {
     const result = await deleteSession(id);
     if (result.error) alert(result.error);
     else window.location.reload();
   }
 }

 async function handleOpenAttendance(sessionId: string, classId: string, sessionDate: string) {
   if (sessionDate !== getTodayString()) {
     alert("Vous ne pouvez faire l'appel que le jour de la séance.");
     return;
   }

   setAttendanceSessionId(sessionId);
   const classStudents = students.filter(s => s.class_id === classId);
   
   const initialData = classStudents.map(s => ({
     student_id: s.id,
     status: 'present',
     first_name: s.first_name,
     last_name: s.last_name
   }));
   setAttendanceData(initialData);
 }

 function toggleAttendance(studentId: string) {
   setAttendanceData(prev => prev.map(s => 
     s.student_id === studentId 
       ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } 
       : s
   ));
 }

 async function handleSaveAttendance() {
   if (!attendanceSessionId) return;
   setSavingAttendance(true);
   
   const result = await saveAttendance(attendanceSessionId, attendanceData);
   
   setSavingAttendance(false);
   if (result.error) {
     alert("Erreur: " + result.error);
   } else {
     alert("Appel enregistré avec succès !");
     setAttendanceSessionId(null);
   }
 }

 // --- LOGIQUE NOTES ---
 async function handleCreateEval(formData: FormData) {
   const result = await createEvaluation(formData);
   if (result.error) alert(result.error);
   else {
     setShowAddEval(false);
     window.location.reload();
   }
 }

 async function handleOpenEval(evalId: string, classId: string) {
   setSelectedEvalForGrades(evalId);
   const classStudents = students.filter(s => s.class_id === classId);
   
   const existingGrades = grades.filter(g => g.evaluation_id === evalId);
   
   const initialData = classStudents.map(s => {
     const existing = existingGrades.find(g => g.student_id === s.id);
     return {
       student_id: s.id,
       score: existing ? existing.score : '',
       first_name: s.first_name,
       last_name: s.last_name
     }
   });
   setEvalData(initialData);
 }

 function handleScoreChange(studentId: string, value: string) {
   setEvalData(prev => prev.map(s => 
     s.student_id === studentId ? { ...s, score: value } : s
   ));
 }

 async function handleSaveGrades() {
   if (!selectedEvalForGrades) return;
   setSavingGrades(true);
   
   const formattedData = evalData.map(d => ({
     student_id: d.student_id,
     score: d.score === '' ? null : parseFloat(d.score.toString())
   }));

   const result = await saveGrades(selectedEvalForGrades, formattedData);
   setSavingGrades(false);
   
   if (result.error) alert("Erreur: " + result.error);
   else {
     alert("Notes enregistrées avec succès !");
     setSelectedEvalForGrades(null);
     window.location.reload();
   }
 }

 async function handleCreateTeacher(formData: FormData) {
   setCreatingTeacher(true);
   const result = await createTeacher(formData);
   setCreatingTeacher(false);
   
   if (result.error) {
     alert("Erreur: " + result.error);
   } else {
     alert("Compte enseignant créé avec succès !");
     getTeachers().then(res => {
       if (res.data) setTeachersList(res.data);
     });
   }
 }

 // --- LOGIQUE POSTES INFORMATIQUES ---
 async function handleAssignStudent(formData: FormData) {
   if (!assigningPc || !supabase) return;
   
   const studentId = formData.get('student_id') as string;
   const pcNumber = assigningPc;

  // SÉCURITÉ 1 : Vérifier si le poste n'est pas déjà plein (max 2)
  const currentAssignments = computerAssignments.filter(a => a.computer_number === pcNumber);
  if (currentAssignments.length >= 2) {
    alert("Ce poste est déjà occupé par 2 élèves maximum.");
    return;
  }

  // SÉCURITÉ 2 : Vérifier si l'élève n'est pas déjà sur un autre poste
  const isAlreadyAssigned = computerAssignments.some(a => a.student_id === studentId);
  if (isAlreadyAssigned) {
    alert("Cet élève est déjà attribué à un autre poste.");
    return;
  }

  const { error } = await supabase.from('computer_assignments').insert({
    computer_number: pcNumber,
    student_id: studentId
  });

  if (error) {
    alert("Erreur: " + error.message);
  } else {
    setComputerAssignments(prev => [...prev, { computer_number: pcNumber, student_id: studentId }]);
    setAssigningPc(null); 
  }
}

async function handleRemoveAssignment(pcNumber: number, studentId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from('computer_assignments')
    .delete()
    .eq('computer_number', pcNumber)
    .eq('student_id', studentId);
    
  if (!error) {
    setComputerAssignments(prev => prev.filter(a => !(a.computer_number === pcNumber && a.student_id === studentId)));
  }
}

 const filtered=classes.filter(c=>(c.name+' '+c.level+' '+c.school_year).toLowerCase().includes(query.toLowerCase()));

 if(!user) return (
   <main className="login-shell" dir={rtl?'rtl':'ltr'}>
     <div className="login-art">
       <div className="brand"><span className="brand-icon"><Computer size={26}/></span><span>Zin<span className="brand-accent">Lab</span></span></div>
       <div className="art-copy"><span className="eyebrow">SMART LAB MANAGEMENT</span><h1>{rtl?'إدارة ذكية لمخبر الإعلامية':'Le laboratoire informatique, simplement.'}</h1><p>{rtl?'إدارة الأقسام والحصص والحضور والأعداد في فضاء واحد.':'Gérez les classes, les séances, les présences et les notes depuis un espace sécurisé.'}</p><div className="art-pills"><span><ShieldCheck size={15}/> Sécurisé</span><span><Globe2 size={15}/> FR / AR</span><span><Activity size={15}/> En ligne</span></div></div>
       <div className="art-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
         <span>ZinLab · Éducation numérique</span>
         <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>Developed by Ezzine Moez</span>
       </div>
     </div>
     <section className="login-panel">
       <div className="login-top"><span className="mobile-brand">Zin<span className="brand-accent">Lab</span></span><button className="lang-button" onClick={()=>setLang(rtl?'fr':'ar')}><Globe2 size={16}/>{rtl?'Français':'العربية'}</button></div>
       
       {isForgotPassword ? (
         <form className="login-card" onSubmit={handleForgotPassword}>
           <div className="login-symbol"><ShieldCheck size={25}/></div>
           <h2>{t.resetPassword}</h2>
           <p className="muted">{t.resetDesc}</p>
           <label>{t.email}
             <input type="email" name="reset_email" placeholder="nom@lycee.tn" required />
           </label>
           
           {notice && <div className={`notice ${notice.includes('envoyé') || notice.includes('تم') ? '' : 'error'}`}>{notice}</div>}
           
           <button className="primary full" disabled={!supabaseReady || loginBusy}>
             {loginBusy ? 'Envoi...' : t.sendLink}
           </button>
           
           <div style={{ textAlign: 'center', marginTop: '10px' }}>
             <button type="button" onClick={() => {setIsForgotPassword(false); setNotice('');}} className="text-button">
               {t.backToLogin}
             </button>
           </div>
         </form>
       ) : (
         <form className="login-card" onSubmit={signIn}>
           <div className="login-symbol"><ShieldCheck size={25}/></div>
           <h2>{t.login}</h2><p className="muted">{rtl?'مرحباً بك في فضاء العمل الخاص بك':'Connectez-vous à votre espace de travail ZinLab.'}</p>
           <label>{t.email}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nom@lycee.tn" autoComplete="email" required/></label>
           <label>{t.password}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required minLength={6}/></label>
           
           {notice&&<div className="notice error">{notice}</div>}
           {!supabaseReady&&<div className="notice warn">{t.configure}</div>}
           
           <button className="primary full" disabled={!supabaseReady||loginBusy}>{loginBusy?t.signingIn:t.signIn}</button>
           
           <div style={{ textAlign: 'center', marginTop: '10px' }}>
             <button type="button" onClick={() => {setIsForgotPassword(true); setNotice('');}} className="text-button">
               {t.forgotPassword}
             </button>
           </div>
           <p className="login-hint">{t.noAccount}</p>
         </form>
       )}
       
       <div className="login-bottom">© 2026 ZinLab · {rtl?'فضاء تعليمي':'Espace éducatif'}</div>
     </section>
   </main>
 );

 return (
   <main className={rtl?'app-shell rtl':'app-shell'} dir={rtl?'rtl':'ltr'}>
     <aside className={`sidebar ${mobileNav?'show':''}`}>
       <div className="brand side-brand"><span className="brand-icon"><Computer size={24}/></span><span>Zin<span className="brand-accent">Lab</span><small>LAB MANAGEMENT</small></span><button className="close-nav" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
       <div className="school-chip"><span className="school-dot"/><span><b>Lycée</b><small>{t.schoolYear} {year}</small></span><ChevronDown size={16}/></div>
       <div className="nav-caption">MENU PRINCIPAL</div>
       <nav>
         {nav.map(([key,Icon])=>(
           <button key={key} onClick={()=>{setActive(key);setMobileNav(false);setNotice('');setSelectedClassForStudents(null);setAttendanceSessionId(null);setSelectedEvalForGrades(null);}} className={`nav-item ${active===key?'selected':''}`}>
             <Icon size={18}/><span>{t[key as keyof typeof t]}</span>
             {key==='classes'&&<span className="nav-count">{classes.length}</span>}
           </button>
         ))}
       </nav>
       <div className="sidebar-bottom">
         <div className="help-card"><div className="help-icon"><GraduationCap size={20}/></div><b>Besoin d’aide ?</b><p>Consultez le guide d’utilisation ZinLab.</p><button onClick={()=>setNotice('Guide d’utilisation : module en préparation.')}>Consulter le guide ↗</button></div>
         <button className="user-mini" onClick={signOut}><span className="avatar">{(profile?.full_name||user.email).slice(0,1).toUpperCase()}</span><span className="user-mini-text"><b>{profile?.full_name||user.email}</b><small>{isSuperAdmin?t.roleAdmin:t.roleTeacher}</small></span><LogOut size={17}/></button>
       </div>
     </aside>
     
     {mobileNav&&<button className="nav-scrim" aria-label="Fermer le menu" onClick={()=>setMobileNav(false)}/>}
     
     <section className="main-area">
       <header className="topbar">
         <div className="top-left">
           <button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={21}/></button>
           <div>
             <div className="breadcrumb">Espace de travail <span>/</span> <b>{t[active as keyof typeof t]}</b></div>
             <div className="top-title">{t[active as keyof typeof t]}</div>
           </div>
         </div>
         <div className="top-actions">
           <label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/><kbd>⌘ K</kbd></label>
           <button className="lang-button" onClick={()=>setLang(rtl?'fr':'ar')}><Globe2 size={16}/>{rtl?'FR':'عربي'}</button>
           <span className="avatar top-avatar">{(profile?.full_name||user.email).slice(0,1).toUpperCase()}</span>
         </div>
       </header>

       <div className="content">
         <div className="welcome-row">
           <div>
             <div className="eyebrow">LUNDI · ESPACE PROFESSIONNEL</div>
             <h1>{t.welcome} <span className="wave">✦</span></h1>
             <p className="muted">{t.overview}</p>
           </div>
           <div className="year-select">
             <CalendarDays size={17}/>
             <select value={year} onChange={e=>setYear(e.target.value)} aria-label={t.schoolYear}><option>2026/2027</option><option>2025/2026</option><option>2024/2025</option></select>
           </div>
         </div>
         
         {notice&&<div className="notice">{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}

         {active==='dashboard'&& (
           <>
             <div className="stats-grid">
               <Stat icon={<Users/>} label={t.classesCount} value={String(classes.length)} foot="Organisation pédagogique" tone="blue"/>
               <Stat icon={<GraduationCap/>} label={t.studentsCount} value={String(students.length)} foot="Élèves enregistrés" tone="purple"/>
               <Stat icon={<CalendarDays/>} label={t.sessionsCount} value={String(sessions.length)} foot="Séances planifiées" tone="orange"/>
               <Stat icon={<Monitor/>} label={t.computersCount} value="30" foot="Postes configurés" tone="green"/>
             </div>
             <div className="dashboard-grid">
               <section className="panel quick-panel">
                 <div className="panel-heading"><div><h2>{t.quick}</h2><p>Les tâches les plus utilisées</p></div><span className="heading-icon"><Activity size={18}/></span></div>
                 <div className="quick-grid">
                   <Quick icon={<Users/>} title={t.addClass} detail="Organiser vos classes" onClick={()=>{setActive('classes');setShowAdd(true)}}/>
                   <Quick icon={<CalendarDays/>} title={t.newSession} detail="Planifier un cours" onClick={()=>{setActive('sessions');setShowAddSession(true)}}/>
                   <Quick icon={<Check/>} title={t.takeAttendance} detail="Présences et absences" onClick={()=>setActive('attendance')}/>
                   <Quick icon={<Computer/>} title={t.manageComputers} detail="Attribuer les postes" onClick={()=>setActive('computers')}/>
                 </div>
               </section>
               <section className="panel recent-panel">
                 <div className="panel-heading"><div><h2>{t.recent}</h2><p>Vue d’ensemble des classes</p></div><button className="text-button" onClick={()=>setActive('classes')}>Tout voir ↗</button></div>
                 {classes.slice(0,4).map(c=><div className="recent-row" key={c.id}><span className="class-symbol"><Users size={17}/></span><span className="recent-name"><b>{c.name}</b><small>{c.level}</small></span><span className="year-tag">{c.school_year}</span></div>)}
                 {!classes.length&&<div className="empty-state"><Users size={26}/><b>{t.noClasses}</b><span>Ajoutez votre première classe pour commencer.</span><button className="primary small" onClick={()=>{setActive('classes');setShowAdd(true)}}><Plus size={15}/> {t.addClass}</button></div>}
               </section>
             </div>
           </>
         )}

         {active==='classes' && (
           <section className="panel data-panel">
             {!selectedClassForStudents ? (
               <>
                 <div className="panel-heading">
                   <div><h2>{t.classes}</h2><p>Gérez les classes et préparez les listes d’élèves.</p></div>
                   <button className="primary" onClick={()=>setShowAdd(true)}><Plus size={17}/>{t.addClass}</button>
                 </div>
                 {showAdd&&(
                   <form className="add-form" onSubmit={addClass}>
                     <label>{t.className}<input value={className} onChange={e=>setClassName(e.target.value)} placeholder="Ex. 4ème Éco 1" required/></label>
                     <label>{t.level}<select value={level} onChange={e=>setLevel(e.target.value)}><option>Secondaire</option><option>Sciences</option><option>Économie et gestion</option><option>Lettres</option><option>Informatique</option><option>Technique</option></select></label>
                     <label>{t.year}<select value={year} onChange={e=>setYear(e.target.value)}><option>2026/2027</option><option>2025/2026</option><option>2024/2025</option></select></label>
                     <div className="form-actions"><button type="button" className="secondary" onClick={()=>setShowAdd(false)}>{t.cancel}</button><button className="primary"><Check size={16}/>{t.save}</button></div>
                   </form>
                 )}
                 <div className="table-wrap">
                   <table>
                     <thead><tr><th>{t.className}</th><th>{t.level}</th><th>{t.year}</th><th>Élèves</th></tr></thead>
                     <tbody>
                       {filtered.map(c=>
                         <tr key={c.id} onClick={() => setSelectedClassForStudents(c.id)} style={{cursor:'pointer'}}>
                           <td><b>{c.name}</b></td>
                           <td>{c.level}</td>
                           <td><span className="year-tag">{c.school_year}</span></td>
                           <td>{students.filter(s=>s.class_id===c.id).length}</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                   {!filtered.length&&<div className="empty-state"><Users size={28}/><b>{t.noClasses}</b><span>Vérifiez votre recherche ou ajoutez une classe.</span></div>}
                 </div>
               </>
             ) : (
               <div>
                 <div className="students-header">
                   <button onClick={() => setSelectedClassForStudents(null)} className="back-btn">{t.backToClasses}</button>
                   <h2>{t.studentsList} : {classes.find(c => c.id === selectedClassForStudents)?.name}</h2>
                 </div>
                 <div className="action-blocks">
                   <div className="action-card">
                     <h3>Importer une liste</h3><p>Le fichier Excel doit contenir : <b>Nom_complet</b> et <b>Groupe</b> (A, B, C ou D).</p>
                     <ImportExcel classId={selectedClassForStudents} />
                   </div>
                   <div className="action-card">
                     <h3>{t.addStudent}</h3><p>Remplissez les champs pour ajouter un élève à cette classe.</p>
                     <form action={handleAddStudent} className="inline-form">
                       <div className="form-group"><label>{t.firstName}</label><input name="first_name" required className="form-input" style={{ width: '120px' }} /></div>
                       <div className="form-group"><label>{t.lastName}</label><input name="last_name" required className="form-input" style={{ width: '120px' }} /></div>
                       <div className="form-group"><label>{t.group}</label><select name="group" className="form-select"><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                       <button type="submit" className="primary small" style={{ height: '38px' }}>{t.addBtn}</button>
                     </form>
                   </div>
                 </div>
                 <StudentTable initialStudents={students.filter(s => s.class_id === selectedClassForStudents)} />
               </div>
             )}
           </section>
         )}

         {active==='sessions' && (
           <section className="panel data-panel">
             
             {attendanceSessionId ? (
               <div>
                 <div className="students-header">
                   <button onClick={() => setAttendanceSessionId(null)} className="back-btn">{t.backToSessions}</button>
                   <h2>{t.attendanceTitle} : {sessions.find(s => s.id === attendanceSessionId)?.title}</h2>
                 </div>
                 
                 <div className="students-table-container" style={{ marginTop: '20px' }}>
                   <table className="students-table">
                     <thead>
                       <tr>
                         <th>Élève</th>
                         <th style={{ textAlign: 'center' }}>Statut</th>
                       </tr>
                     </thead>
                     <tbody>
                       {attendanceData.length > 0 ? attendanceData.map(student => (
                         <tr key={student.student_id}>
                           <td><b>{student.last_name}</b> {student.first_name}</td>
                           <td style={{ textAlign: 'center' }}>
                             <button 
                               onClick={() => toggleAttendance(student.student_id)}
                               className={`filter-btn ${student.status === 'present' ? 'active' : ''}`}
                               style={{ 
                                 background: student.status === 'present' ? '#189e79' : '#e2e8f0', 
                                 borderColor: 'transparent', 
                                 color: student.status === 'present' ? '#fff' : '#64748b',
                                 width: '100px'
                               }}
                             >
                               {student.status === 'present' ? t.present : t.absent}
                             </button>
                           </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan={2} style={{textAlign:'center', padding:'20px'}}>{t.noStudentsInClass}</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                   <button onClick={handleSaveAttendance} className="primary" disabled={savingAttendance || attendanceData.length === 0}>
                     <Check size={16}/> {savingAttendance ? 'Enregistrement...' : t.saveAttendance}
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 <div className="panel-heading">
                   <div><h2>{t.sessions}</h2><p>Planifiez et gérez vos cours.</p></div>
                   <button className="primary" onClick={()=>setShowAddSession(!showAddSession)}><Plus size={17}/>{t.newSession}</button>
                 </div>
                 
                 {showAddSession && (
                   <form action={handleAddSession} className="add-form" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr' }}>
                     <label>{t.sessionTitle}<input name="title" placeholder="Ex. Introduction à Python" required/></label>
                     <label>{t.sessionClass}
                       <select name="class_id" required>
                         <option value="">Sélectionner...</option>
                         {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </label>
                     <label>{t.sessionDate}<input type="date" name="session_date" required/></label>
                     <label>{t.sessionStart}<input type="time" name="start_time" required/></label>
                     <label>{t.sessionEnd}<input type="time" name="end_time" required/></label>
                     <div className="form-actions">
                       <button type="button" className="secondary" onClick={()=>setShowAddSession(false)}>{t.cancel}</button>
                       <button className="primary"><Check size={16}/>{t.save}</button>
                     </div>
                   </form>
                 )}

                 <div className="table-wrap">
                   <table>
                     <thead>
                       <tr>
                         <th>{t.sessionDate}</th>
                         <th>{t.sessionStart} - {t.sessionEnd}</th>
                         <th>{t.sessionTitle}</th>
                         <th>{t.sessionClass}</th>
                         <th style={{ textAlign: 'right' }}>Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {sessions.length > 0 ? sessions.map(s => {
                         const sessionClass = classes.find(c => c.id === s.class_id);
                         const formattedDate = new Date(s.session_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-TN', { day: 'numeric', month: 'short', year: 'numeric' });
                         const isToday = s.session_date === getTodayString();

                         return (
                           <tr key={s.id}>
                             <td>
                               <b>{formattedDate}</b> 
                               {isToday && <span style={{fontSize:'10px', color:'#189e79', background:'#e2f8f0', padding:'2px 6px', borderRadius:'4px', marginLeft:'6px', fontWeight:'bold'}}>Aujourd'hui</span>}
                             </td>
                             <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b' }}><Clock size={14}/> {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</span></td>
                             <td>{s.title}</td>
                             <td><span className="year-tag">{sessionClass?.name || 'Classe inconnue'}</span></td>
                             <td style={{ textAlign: 'right' }}>
                               <button 
                                 onClick={() => handleOpenAttendance(s.id, s.class_id, s.session_date)} 
                                 className={`action-btn ${isToday ? 'edit' : ''}`} 
                                 title={isToday ? t.takeAttendance : "L'appel n'est possible que le jour de la séance"}
                                 disabled={!isToday}
                                 style={{ marginRight: '8px', opacity: isToday ? 1 : 0.3, cursor: isToday ? 'pointer' : 'not-allowed', backgroundColor: isToday ? '#eaf0ff' : 'transparent' }}
                               >
                                 <CheckSquare size={18} />
                               </button>
                               <button onClick={() => handleDeleteSession(s.id)} className="action-btn delete" title={t.actionDelete}>
                                 <Trash2 size={18}/>
                               </button>
                             </td>
                           </tr>
                         )
                       }) : (
                         <tr>
                           <td colSpan={5}>
                             <div className="empty-state">
                               <CalendarDays size={28}/>
                               <b>{t.noSessions}</b>
                               <span>Cliquez sur "Créer une séance" pour commencer.</span>
                             </div>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </>
             )}
           </section>
         )}

         {active==='attendance' && (
           <section className="panel placeholder-panel">
             <span className="placeholder-icon"><CheckSquare size={27}/></span>
             <h2>{t.attendance}</h2>
             <p>Pour faire l'appel, veuillez vous rendre dans le module <b>Séances</b> et cliquer sur l'icône <CheckSquare size={14} style={{display:'inline', margin:'0 4px'}}/> à côté de la séance du jour.</p>
             <button className="primary" onClick={()=>setActive('sessions')}>Aller aux séances</button>
           </section>
         )}

         {active==='grades' && (
           <section className="panel data-panel">
             {selectedEvalForGrades ? (
               <div>
                 <div className="students-header">
                   <button onClick={() => setSelectedEvalForGrades(null)} className="back-btn">{t.backToEvals}</button>
                   <h2>{t.enterGrades} : {evaluations.find(e => e.id === selectedEvalForGrades)?.title}</h2>
                 </div>
                 
                 <div className="students-table-container" style={{ marginTop: '20px' }}>
                   <table className="students-table">
                     <thead>
                       <tr>
                         <th>Élève</th>
                         <th style={{ textAlign: 'center', width: '150px' }}>{t.score}</th>
                       </tr>
                     </thead>
                     <tbody>
                       {evalData.map(student => (
                         <tr key={student.student_id}>
                           <td><b>{student.last_name}</b> {student.first_name}</td>
                           <td style={{ textAlign: 'center' }}>
                             <input 
                               type="number" 
                               step="0.25" 
                               min="0" 
                               max="20"
                               value={student.score}
                               onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                               className="form-input" 
                               style={{ width: '80px', textAlign: 'center' }} 
                             />
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                   <button onClick={handleSaveGrades} className="primary" disabled={savingGrades}>
                     <Check size={16}/> {savingGrades ? 'Enregistrement...' : t.saveGrades}
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 <div className="panel-heading">
                   <div><h2>{t.gradesTitle}</h2><p>Gérez les évaluations et saisissez les notes.</p></div>
                   <button className="primary" onClick={()=>setShowAddEval(!showAddEval)}><Plus size={17}/>{t.addEval}</button>
                 </div>
                 
                 {showAddEval && (
                   <form action={handleCreateEval} className="add-form" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                     <label>{t.evalTitle}<input name="title" placeholder="Ex. Contrôle 1" required/></label>
                     <label>{t.evalClass}
                       <select name="class_id" required>
                         <option value="">Sélectionner...</option>
                         {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </label>
                     <label>{t.evalDate}<input type="date" name="date_eval" required/></label>
                     <div className="form-actions">
                       <button type="button" className="secondary" onClick={()=>setShowAddEval(false)}>{t.cancel}</button>
                       <button className="primary"><Check size={16}/>{t.evalBtn}</button>
                     </div>
                   </form>
                 )}

                 <div className="table-wrap">
                   <table>
                     <thead>
                       <tr>
                         <th>{t.evalDate}</th>
                         <th>{t.evalTitle}</th>
                         <th>{t.evalClass}</th>
                         <th style={{ textAlign: 'right' }}>Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {evaluations.length > 0 ? evaluations.map(e => {
                         const evalClass = classes.find(c => c.id === e.class_id);
                         return (
                           <tr key={e.id}>
                             <td>{new Date(e.date_eval).toLocaleDateString('fr-FR')}</td>
                             <td><b>{e.title}</b></td>
                             <td><span className="year-tag">{evalClass?.name || 'Classe inconnue'}</span></td>
                             <td style={{ textAlign: 'right' }}>
                               <button onClick={() => handleOpenEval(e.id, e.class_id)} className="action-btn edit" title="Saisir les notes">
                                 <Pencil size={18} />
                               </button>
                             </td>
                           </tr>
                         )
                       }) : (
                         <tr>
                           <td colSpan={4}>
                             <div className="empty-state">
                               <BookOpen size={28}/>
                               <b>{t.noEvals}</b>
                               <span>Cliquez sur "Créer une évaluation" pour commencer.</span>
                             </div>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </>
             )}
           </section>
         )}

         {active==='settings' && (
           <section className="panel data-panel">
             <div className="panel-heading">
               <div><h2>Paramètres de l'application</h2><p>Gérez votre compte et les accès.</p></div>
             </div>

             {isSuperAdmin ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                 <div className="action-card" style={{ maxWidth: '950px' }}>
                   <h3>{t.adminSettingsTitle} (Super Admin)</h3>
                   <p>{t.adminSettingsDesc}</p>
                   
                   <form action={handleCreateTeacher} className="inline-form" style={{ flexWrap: 'wrap', alignItems: 'flex-end', gap: '15px' }}>
                     <div className="form-group">
                       <label>{t.teacherFirstName}</label>
                       <input name="first_name" required className="form-input" placeholder="Ex: Ahmed" style={{ width: '130px' }} />
                     </div>
                     <div className="form-group">
                       <label>{t.teacherName}</label>
                       <input name="last_name" required className="form-input" placeholder="Ex: Ben Ali" style={{ width: '130px' }} />
                     </div>
                     <div className="form-group">
                       <label>{t.teacherEmail}</label>
                       <input type="email" name="email" required className="form-input" placeholder="prof@lycee.tn" style={{ width: '180px' }} />
                     </div>
                     <div className="form-group">
                       <label>{t.teacherPassword}</label>
                       <input type="password" name="password" required className="form-input" minLength={6} placeholder="••••••••" style={{ width: '130px' }} />
                     </div>
                     <button type="submit" className="primary" style={{ height: '40px' }} disabled={creatingTeacher}>
                       <UserPlus size={16} style={{ marginRight: '8px' }}/> {creatingTeacher ? 'Création...' : t.createTeacherBtn}
                     </button>
                   </form>
                 </div>

                 <div>
                   <h3 style={{ marginBottom: '15px' }}>{t.teachersList}</h3>
                   <div className="table-wrap">
                     <table>
                       <thead>
                         <tr>
                           <th>{t.teacherFirstName}</th>
                           <th>{t.teacherName}</th>
                           <th>{t.idUser}</th>
                           <th>{t.role}</th>
                           <th>{t.dateCreated}</th>
                         </tr>
                       </thead>
                       <tbody>
                         {teachersList.map((teacher) => (
                           <tr key={teacher.id}>
                             <td>{teacher.first_name || '-'}</td>
                             <td><b>{teacher.full_name}</b></td>
                             <td><span style={{fontSize:'11px', color:'#64748b'}}>{teacher.id}</span></td>
                             <td><span className="year-tag">{teacher.role}</span></td>
                             <td>{new Date(teacher.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-TN')}</td>
                           </tr>
                         ))}
                         {teachersList.length === 0 && (
                           <tr>
                             <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>{t.noTeachers}</td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="empty-state" style={{ marginTop: '20px' }}>
                 <ShieldCheck size={28} />
                 <b>{t.restrictedAccess}</b>
                 <span>{t.restrictedDesc}</span>
               </div>
             )}
           </section>
         )}

         {/* --- HISTORIQUE --- */}
         {active==='history' && (
           <section className="panel data-panel">
             <div className="panel-heading">
               <div><h2>Historique des appels</h2><p>Retrouvez la liste de tous les appels enregistrés.</p></div>
             </div>
             
             <div className="table-wrap">
               <table>
                 <thead>
                   <tr>
                     <th>Date de la séance</th>
                     <th>Classe</th>
                     <th>Titre de la séance</th>
                     <th>Statut</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sessions.filter(s => s.session_date <= getTodayString()).length > 0 ? (
                     sessions
                       .filter(s => s.session_date <= getTodayString()) 
                       .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()) 
                       .map(s => {
                         const sessionClass = classes.find(c => c.id === s.class_id);
                         const isToday = s.session_date === getTodayString();
                         
                         return (
                           <tr key={s.id}>
                             <td>
                               <b>{new Date(s.session_date).toLocaleDateString('fr-FR')}</b>
                               {isToday && <span style={{fontSize:'10px', color:'#189e79', background:'#e2f8f0', padding:'2px 6px', borderRadius:'4px', marginLeft:'6px', fontWeight:'bold'}}>Aujourd'hui</span>}
                             </td>
                             <td><span className="year-tag">{sessionClass?.name || 'Classe inconnue'}</span></td>
                             <td>{s.title}</td>
                             <td style={{ color: isToday ? '#189e79' : '#64748b', fontWeight: 600 }}>
                               {isToday ? 'En cours...' : 'Enregistré'}
                             </td>
                           </tr>
                         )
                       })
                   ) : (
                     <tr>
                       <td colSpan={4}>
                         <div className="empty-state">
                           <Activity size={28}/>
                           <b>Aucun historique pour le moment.</b>
                           <span>Les séances passées apparaîtront ici.</span>
                         </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </section>
         )}

         {/* --- POSTES INFORMATIQUES --- */}
         {active==='computers' && (
           <section className="panel data-panel">
             <div className="panel-heading">
               <div><h2>Postes informatiques</h2><p>Attribuez les ordinateurs du laboratoire (Max 2 élèves par poste).</p></div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginTop: '20px' }}>
               {Array.from({ length: 30 }).map((_, i) => {
                 const pcNumber = i + 1;
                 const assignmentsForPc = computerAssignments.filter(a => a.computer_number === pcNumber);
                 const isFull = assignmentsForPc.length >= 2;

                 return (
                   <div 
                     key={pcNumber} 
                     className="action-card" 
                     style={{ 
                       padding: '15px 10px', 
                       background: assignmentsForPc.length > 0 ? '#f0f6ff' : '#f8fafc',
                       borderColor: assignmentsForPc.length > 0 ? '#b7c7ff' : '#e2e8f0',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '10px'
                     }}
                   >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <b style={{ fontSize: '14px', color: '#1e293b' }}>Poste {pcNumber}</b>
                       <Monitor size={20} color={assignmentsForPc.length > 0 ? '#3766e8' : '#94a3b8'} />
                     </div>
                     
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                       {assignmentsForPc.map((assignment, idx) => {
                         const student = students.find(s => s.id === assignment.student_id);
                         return (
                           <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                             <span style={{ fontSize: '12px', fontWeight: 500 }}>
                               {student ? `${student.first_name} ${student.last_name}` : 'Élève inconnu'}
                             </span>
                             <button onClick={() => handleRemoveAssignment(pcNumber, assignment.student_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                               <X size={14} />
                             </button>
                           </div>
                         );
                       })}
                       {assignmentsForPc.length === 0 && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Libre</span>}
                     </div>

                     {!isFull && (
                       <button 
                         onClick={() => setAssigningPc(pcNumber)}
                         className="secondary small" 
                         style={{ marginTop: 'auto', justifyContent: 'center' }}
                       >
                         <Plus size={14} style={{ marginRight: '5px' }} /> Attribuer
                       </button>
                     )}
                   </div>
                 );
               })}
             </div>

             {/* POPUP D'ATTRIBUTION */}
             {assigningPc !== null && (
               <div className="nav-scrim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                 <div className="action-card" style={{ background: '#fff', width: '100%', maxWidth: '400px', zIndex: 51 }}>
                   <h3 style={{ marginBottom: '15px' }}>Attribuer le Poste {assigningPc}</h3>
                   <form action={handleAssignStudent}>
                     <div className="form-group">
                       <label>Sélectionner un élève</label>
                       <select name="student_id" required className="form-select">
                         <option value="">-- Choisir un élève --</option>
                         {students
                           .filter(s => !computerAssignments.some(a => a.student_id === s.id)) // On filtre les élèves déjà attribués
                           .map(s => (
                             <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>
                           ))
                         }
                       </select>
                     </div>
                     <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                       <button type="button" onClick={() => setAssigningPc(null)} className="secondary">Annuler</button>
                       <button type="submit" className="primary">Attribuer</button>
                     </div>
                   </form>
                 </div>
               </div>
             )}
           </section>
         )}

         <footer className="footer">
           <span>© 2026 <b>ZinLab</b> · Gestion intelligente du laboratoire · <i style={{color: '#64748b'}}>Developed by Ezzine Moez</i></span>
           <span><span className="online-dot"/> Système connecté</span>
         </footer>
       </div>
     </section>
   </main>
 );
}

function Stat({icon,label,value,foot,tone}:{icon:React.ReactNode;label:string;value:string;foot:string;tone:string}){
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>
}

function Quick({icon,title,detail,onClick}:{icon:React.ReactNode;title:string;detail:string;onClick:()=>void}){
  return <button className="quick-item" onClick={onClick}><span className="quick-icon">{icon}</span><span className="quick-copy"><b>{title}</b><small>{detail}</small></span><span className="quick-arrow">↗</span></button>
}