import React, { useState, useMemo, useRef } from 'react';
import { 
  Trash2,
  Copy,
  Edit3,
  QrCode,
  Phone, 
  Search, 
  Download, 
  Upload, 
  UserPlus, 
  Filter, 
  ChevronRight,
  ChevronDown,
  Mail, 
  Building, 
  Star, 
  ShieldAlert,
  Lock,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Chrome,
  Smartphone,
  Globe,
  MoreHorizontal,
  MapPin,
  Cake,
  Globe2,
  StickyNote,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { VaultItem, ContactData } from '../../types';

interface PhoneBookViewProps {
  items: VaultItem[];
  onBack: () => void;
  onAddItem: () => void;
  onEditItem: (item: VaultItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onImport: (items: VaultItem[]) => void;
}

export const PhoneBookView: React.FC<PhoneBookViewProps> = ({
  items,
  onBack,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleFavorite,
  onImport
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'emergency' | 'google' | 'iphone' | 'naver'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const pinInputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setPinError(false);

    if (digit && index < 3) {
      pinInputs[index + 1].current?.focus();
    }

    // Auto-unlock check
    const fullPin = newPin.join('');
    if (fullPin.length === 4) {
      if (fullPin === '0114') {
        // Correct PIN: Auto-unlock with a slight delay for visual feedback
        setTimeout(() => setIsUnlocked(true), 250);
      } else {
        // Wrong PIN: Trigger error
        setPinError(true);
        setTimeout(() => {
          setPin(['', '', '', '']);
          setPinError(false);
          pinInputs[0].current?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      pinInputs[index - 1].current?.focus();
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullPin = pin.join('');
    if (fullPin === '0114') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => {
        setPin(['', '', '', '']);
        setPinError(false);
        pinInputs[0].current?.focus();
      }, 500);
    }
  };

  const filledCount = pin.filter(p => p !== '').length;
  const isReady = filledCount === 4;

  const [selectedQrContact, setSelectedQrContact] = useState<VaultItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const allContacts = items.filter(i => i.category === 'contact');
    return {
      total: allContacts.length,
      iphone: allContacts.filter(i => i.contactData?.source === 'iphone').length,
      google: allContacts.filter(i => i.contactData?.source === 'google').length,
      naver: allContacts.filter(i => i.contactData?.source === 'naver').length,
      favorites: allContacts.filter(i => i.isFavorite).length
    };
  }, [items]);

  const contacts = useMemo(() => {
    return items
      .filter(i => i.category === 'contact')
      .filter(i => {
        if (filter === 'favorites') return i.isFavorite;
        if (filter === 'emergency') return i.contactData?.isEmergency;
        if (filter === 'google' || filter === 'iphone' || filter === 'naver') {
          return i.contactData?.source === filter;
        }
        return true;
      })
      .filter(i => {
        const q = search.toLowerCase();
        const data = i.contactData;
        const fullName = data ? `${data.lastName || ''}${data.name}`.toLowerCase() : '';
        if (!data) return i.title.toLowerCase().includes(q);
        return (
          i.title.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          data.name.toLowerCase().includes(q) ||
          (data.lastName || '').toLowerCase().includes(q) ||
          data.phoneNumber.includes(q) ||
          data.email?.toLowerCase().includes(q) ||
          data.organization?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aName = a.contactData ? `${a.contactData.lastName || ''}${a.contactData.name}` : a.title;
        const bName = b.contactData ? `${b.contactData.lastName || ''}${b.contactData.name}` : b.title;
        return aName.localeCompare(bName, 'ko');
      });
  }, [items, search, filter]);

  if (!isUnlocked) {
    const ANG = [-12, -4, 4, 12];
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[radial-gradient(circle_at_50%_18%,#141926_0%,#0b0d12_60%)] p-4 font-mono overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-10 py-12 px-8 w-full max-w-lg"
        >
          <p className="text-[13px] tracking-widest text-[#6b7280] text-center">
            전일 주소록 <b className="text-[#e8ecf1] font-medium">4자리</b> PIN 입력
          </p>

          {/* Seal */}
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle className="fill-none stroke-[#1f2430] stroke-[3]" cx="20" cy="20" r="17" />
              <circle 
                className="fill-none stroke-[#7fd8e0] stroke-[3] transition-all duration-500" 
                style={{ 
                  strokeDasharray: '106.8', 
                  strokeDashoffset: 106.8 - (filledCount / 4 * 106.8),
                  strokeLinecap: 'round'
                }} 
                cx="20" 
                cy="20" 
                r="17" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#e8ecf1] tabular-nums">
              {filledCount}/4
            </div>
          </div>

          {/* Card Hand */}
          <div className="relative flex gap-4 pt-10 h-44 items-start justify-center w-full [perspective:1000px]">
            {pin.map((digit, i) => (
              <label 
                key={i} 
                className={`relative block w-14 h-20 origin-[50%_320%] transition-all duration-500 ${pinError ? 'animate-shake' : ''}`}
                style={{ 
                  transform: `translateY(-16px) rotate(${ANG[i]}deg) translateZ(20px)`,
                  ['--rot' as any]: `${ANG[i]}deg`,
                  filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))'
                }}
              >
                <input
                  ref={pinInputs[i]}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`absolute inset-0 w-full h-full bg-[#12151c] border-x border-t-[#2a3040] border-b-[#0a0c10] rounded-xl text-center text-2xl text-[#e8ecf1] outline-none caret-[#7fd8e0] transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] ${
                    digit ? 'border-[#7fd8e0] shadow-[0_0_20px_rgba(127,216,224,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]' : 'border-[#1f2430] focus:border-[#3c5a5e] focus:bg-[#161a23]'
                  }`}
                />
                {/* Win Glow */}
                <div className={`absolute inset-0 rounded-xl pointer-events-none bg-[radial-gradient(circle_at_50%_30%,rgba(127,216,224,0.2),transparent_75%)] transition-opacity duration-300 ${digit ? 'opacity-100' : 'opacity-0'}`} />
                {/* Spark Effect */}
                <svg className="absolute -inset-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] pointer-events-none overflow-visible">
                  <rect 
                    className={`fill-none stroke-[#f2c078] stroke-2 rounded-xl transition-all ${digit ? 'animate-spark' : 'opacity-0'}`}
                    style={{ strokeDasharray: '1', strokeDashoffset: '1' }}
                    x="2" y="2" width="52" height="68" rx="10" pathLength="1" 
                  />
                </svg>
              </label>
            ))}
          </div>

          <p className={`text-xs min-h-[16px] font-medium transition-colors ${pinError ? 'text-[#e0667f]' : 'text-[#6b7280]'}`}>
            {pinError ? 'PIN 번호가 올바르지 않습니다' : isReady ? '준비되었습니다' : '\u00A0'}
          </p>

          <button 
            onClick={() => handlePinSubmit()}
            disabled={!isReady}
            className={`px-10 py-3.5 rounded-full text-[13px] tracking-widest font-bold transition-all duration-300 ${
              isReady 
                ? 'bg-[#7fd8e0] text-[#0b0d12] cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(127,216,224,0.3)]' 
                : 'bg-[#1f2430] text-[#6b7280] cursor-not-allowed'
            }`}
          >
            잠금 해제
          </button>
        </motion.div>
      </div>
    );
  }

  const generateVCard = (item: VaultItem) => {
    const data = item.contactData;
    if (!data) return '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${data.lastName || ''}${data.name}`,
      `N:${data.lastName || ''};${data.name};;;`,
      `TEL;TYPE=CELL:${data.phoneNumber}`,
    ];

    if (data.secondaryPhone) lines.push(`TEL;TYPE=WORK:${data.secondaryPhone}`);
    if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
    if (data.organization) lines.push(`ORG:${data.organization}`);
    if (data.jobTitle) lines.push(`TITLE:${data.jobTitle}`);
    if (data.address) lines.push(`ADR;TYPE=HOME:;;${data.address};;;`);
    if (data.birthday) lines.push(`BDAY:${data.birthday.replace(/-/g, '')}`);
    if (data.website) lines.push(`URL:${data.website}`);
    if (data.relationship) {
      lines.push('itemR.X-ABRELATEDNAMES:' + data.relationship);
      lines.push('itemR.X-ABLabel:Relationship');
    }
    if (data.customFields && data.customFields.length > 0) {
      data.customFields.forEach((field, idx) => {
        const prefix = `itemCustom${idx}`;
        lines.push(`${prefix}.${field.label.includes('DATE') ? 'X-ABDATE' : 'X-ABRELATEDNAMES'}:${field.value}`);
        lines.push(`${prefix}.X-ABLabel:${field.label}`);
      });
    }
    if (data.privateNotes || item.notes) lines.push(`NOTE:${data.privateNotes || item.notes}`);

    lines.push('END:VCARD');
    return lines.join('\n');
  };

  const getSourceInfo = (source?: string) => {
    switch (source) {
      case 'google':
        return { label: 'Google', icon: Chrome, color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'iphone':
        return { label: 'iPhone', icon: Smartphone, color: 'text-slate-700 bg-slate-50 border-slate-200' };
      case 'naver':
        return { label: 'Naver', icon: Globe, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      default:
        return { label: '기타', icon: MoreHorizontal, color: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
  };

  const handleExport = () => {
    const contactData = contacts.map(c => ({
      title: c.title,
      name: c.contactData?.name,
      phone: c.contactData?.phoneNumber,
      email: c.contactData?.email,
      org: c.contactData?.organization,
      emergency: c.contactData?.isEmergency,
      tags: c.tags.join(',')
    }));
    
    const blob = new Blob([JSON.stringify(contactData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret_vault_contacts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportVCF = () => {
    const vcardContent = contacts.map(contact => generateVCard(contact)).join('\n');
    const blob = new Blob([vcardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'Title', 'Name', 'LastName', 'Phone', 'SecondaryPhone', 'Email', 
      'SecondaryEmail', 'Organization', 'JobTitle', 'Address', 'Birthday', 
      'Website', 'Relationship', 'Emergency', 'Source', 'Tags', 'Notes', 'CustomFields'
    ];

    const rows = contacts.map(c => {
      const data = c.contactData;
      const customData = data?.customFields?.map(f => `${f.label}:${f.value}`).join(' | ') || '';
      
      const values = [
        c.title,
        data?.name || '',
        data?.lastName || '',
        data?.phoneNumber || '',
        data?.secondaryPhone || '',
        data?.email || '',
        data?.secondaryEmail || '',
        data?.organization || '',
        data?.jobTitle || '',
        data?.address || '',
        data?.birthday || '',
        data?.website || '',
        data?.relationship || '',
        data?.isEmergency ? 'Yes' : 'No',
        data?.source || '',
        c.tags.join(';'),
        (data?.privateNotes || c.notes || '').replace(/\n/g, ' '),
        customData
      ];

      return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name.toLowerCase();
      let importedContacts: any[] = [];

      // Heuristic source detection
      const detectSource = (fname: string, text: string): 'google' | 'iphone' | 'naver' | 'other' => {
        const t = text.toLowerCase();
        if (fname.endsWith('.vcf')) {
          if (t.includes('apple inc') || t.includes('x-ablabel')) return 'iphone';
          if (t.includes('google') || t.includes('categories:mycontacts')) return 'google';
          return 'iphone'; // Default for vcf
        }
        if (t.includes('given name') && t.includes('family name')) return 'google';
        if (t.includes('naver') || (t.includes('이름') && t.includes('전자우편'))) return 'naver';
        return 'other';
      };

      const source = detectSource(fileName, content);

      try {
        if (fileName.endsWith('.json')) {
          importedContacts = JSON.parse(content);
        } else if (fileName.endsWith('.csv')) {
          importedContacts = parseCSV(content);
        } else if (fileName.endsWith('.vcf')) {
          importedContacts = parseVCard(content);
        } else {
          alert('지원하지 않는 파일 형식입니다. (.json, .csv, .vcf 가능)');
          return;
        }

        if (Array.isArray(importedContacts)) {
          const newItems: VaultItem[] = importedContacts.map(c => {
            const fullName = [c.name, c.lastName].filter(Boolean).join(' ');
            return {
              id: 'imported-contact-' + Math.random().toString(36).substring(2, 9),
              title: fullName || '무명 연락처',
              category: 'contact',
              tags: c.tags ? (typeof c.tags === 'string' ? c.tags.split(',') : c.tags) : [],
              isFavorite: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              contactData: {
                name: c.name || '',
                lastName: c.lastName,
                phoneNumber: c.phone || c.phoneNumber || '',
                secondaryPhone: c.secondaryPhone,
                email: c.email,
                secondaryEmail: c.secondaryEmail,
                organization: c.org || c.organization,
                jobTitle: c.jobTitle,
                address: c.address,
                birthday: c.birthday,
                website: c.website,
                relationship: c.relationship,
                customFields: c.customFields,
                isEmergency: c.emergency || c.isEmergency || false,
                source: source,
                privateNotes: c.note
              },
              notes: c.note // Also put in general notes for visibility if needed
            };
          });
          onImport(newItems);
          setIsImporting(false);
          alert(`${newItems.length}개의 연락처를 [${getSourceInfo(source).label}] 형식으로 자동 인식하여 성공적으로 불러왔습니다.`);
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('파일을 처리하는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    return lines.slice(1).filter(l => l.trim()).map(line => {
      // Handle commas inside quotes
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += line[i];
        }
      }
      values.push(current.trim());

      const contact: any = {};
      headers.forEach((h, i) => {
        const v = values[i];
        if (!v) return;

        if (h === 'given name' || h === 'first name' || h === 'name') contact.name = v;
        if (h === 'family name' || h === 'last name') contact.lastName = v;
        if (h.includes('phone') || h.includes('tel')) {
          if (!contact.phone) contact.phone = v;
          else if (!contact.secondaryPhone) contact.secondaryPhone = v;
        }
        if (h.includes('email')) {
          if (!contact.email) contact.email = v;
          else if (!contact.secondaryEmail) contact.secondaryEmail = v;
        }
        if (h.includes('org') || h.includes('company')) contact.org = v;
        if (h.includes('title') || h.includes('job')) contact.jobTitle = v;
        if (h.includes('birthday')) contact.birthday = v;
        if (h.includes('address')) contact.address = v;
        if (h.includes('sns') || h.includes('website')) contact.website = v;
      });

      // Combine names if only 'name' was found but it's full
      if (contact.name && !contact.lastName && contact.name.includes(' ')) {
        const parts = contact.name.split(' ');
        contact.name = parts[0];
        contact.lastName = parts.slice(1).join(' ');
      }

      return contact;
    });
  };

  const parseVCard = (vcf: string) => {
    const cards = vcf.split('END:VCARD');
    return cards.filter(c => c.includes('BEGIN:VCARD')).map(card => {
      const contact: any = {};
      const lines = card.split(/\r?\n/);
      
      // Handle folded lines
      const unfoldedLines: string[] = [];
      lines.forEach(line => {
        if (line.startsWith(' ') && unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += line.substring(1);
        } else {
          unfoldedLines.push(line);
        }
      });

      const groupedFields: Record<string, Record<string, string>> = {};
      const customFields: Array<{ label: string; value: string }> = [];
      const extraDetails: string[] = [];

      unfoldedLines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;
        
        let keyPart = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1).trim();
        
        let prefix = '';
        if (keyPart.includes('.')) {
          const dotIndex = keyPart.indexOf('.');
          prefix = keyPart.substring(0, dotIndex);
          keyPart = keyPart.substring(dotIndex + 1);
        }
        
        const pureKey = keyPart.split(';')[0].toUpperCase();

        if (prefix) {
          if (!groupedFields[prefix]) groupedFields[prefix] = {};
          groupedFields[prefix][pureKey] = value;
        }

        if (pureKey === 'FN') {
          contact.name = value;
        } else if (pureKey === 'N') {
          const parts = value.split(';');
          if (parts[0]) contact.lastName = parts[0].trim();
          if (parts[1]) contact.name = parts[1].trim();
        } else if (pureKey === 'TEL') {
          if (!contact.phone) contact.phone = value;
          else if (!contact.secondaryPhone) contact.secondaryPhone = value;
        } else if (pureKey === 'EMAIL') {
          if (!contact.email) contact.email = value;
          else if (!contact.secondaryEmail) contact.secondaryEmail = value;
        } else if (pureKey === 'ORG') {
          contact.org = value.replace(/;/g, ' ').trim();
        } else if (pureKey === 'TITLE') {
          contact.jobTitle = value;
        } else if (pureKey === 'BDAY') {
          let dateVal = value;
          if (dateVal.length === 8 && /^\d+$/.test(dateVal)) {
            dateVal = `${dateVal.substring(0, 4)}-${dateVal.substring(4, 6)}-${dateVal.substring(6, 8)}`;
          }
          contact.birthday = dateVal;
        } else if (pureKey === 'ADR') {
          const parts = value.split(';');
          contact.address = parts.filter(p => p.trim()).join(', ');
        } else if (pureKey === 'URL') {
          contact.website = value;
        } else if (pureKey === 'NOTE') {
          contact.note = value;
        }
      });

      // Process grouped fields for iOS labels
      Object.values(groupedFields).forEach(group => {
        const label = group['X-ABLABEL'] ? group['X-ABLABEL'].replace(/_\$!<|>!\$_/g, '') : '';
        
        if (group['X-ABDATE']) {
          const date = group['X-ABDATE'];
          const fieldLabel = label || '중요일';
          extraDetails.push(`${fieldLabel}: ${date}`);
          customFields.push({ label: fieldLabel, value: date });
        }
        
        if (group['X-ABRELATEDNAMES']) {
          const name = group['X-ABRELATEDNAMES'];
          const fieldLabel = label || '관련인';
          extraDetails.push(`${fieldLabel}: ${name}`);
          customFields.push({ label: fieldLabel, value: name });
          
          if (label.toLowerCase() === 'spouse' || label === '부부' || label === '마누라') {
            contact.relationship = name;
          }
        }
      });

      contact.customFields = customFields;
      if (extraDetails.length > 0) {
        const extraText = extraDetails.join('\n');
        contact.note = contact.note ? `${contact.note}\n\n[추가 정보]\n${extraText}` : `[추가 정보]\n${extraText}`;
      }

      return contact;
    });
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="glass-panel border-none rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl light-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={onBack}
              className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                보안 주소록
              </h1>
              <p className="hidden xs:block text-[11px] md:text-sm text-slate-500 font-medium mt-0.5 md:mt-1">
                AES-256 암호화로 보호되는 {contacts.length}개의 연락처
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsImporting(true)}
              title="불러오기"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
              <span className="hidden sm:inline">불러오기</span>
            </button>
            <button 
              onClick={handleExportCSV}
              title="CSV 내보내기"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
              <span className="hidden sm:inline">CSV 내보내기</span>
            </button>
            <button 
              onClick={handleExportVCF}
              title="VCF 내보내기"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
              <span className="hidden sm:inline">VCF 내보내기</span>
            </button>
            <button 
              onClick={handleExport}
              title="JSON 내보내기"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button 
              onClick={onAddItem}
              className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold transition-all shadow-md shadow-emerald-100 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {[
            { label: '전체 연락처', value: stats.total, icon: Phone, color: 'bg-slate-50 text-slate-600 border-slate-100' },
            { label: '아이폰', value: stats.iphone, icon: Smartphone, color: 'bg-slate-50 text-slate-700 border-slate-200' },
            { label: '구글', value: stats.google, icon: Chrome, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: '네이버', value: stats.naver, icon: Globe, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { label: '즐겨찾기', value: stats.favorites, icon: Star, color: 'bg-amber-50 text-amber-600 border-amber-100' }
          ].map((stat, idx) => (
            <div key={idx} className={`p-3 rounded-2xl border ${stat.color} flex flex-col gap-1 shadow-sm`}>
              <div className="flex items-center justify-between">
                <stat.icon className="w-3.5 h-3.5 opacity-70" />
                <span className="text-lg font-black">{stat.value}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-4.5 md:h-4.5 text-slate-400" />
            <input 
              type="text"
              placeholder="검색 (이름, 번호, 회사...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 md:pl-11 pr-10 py-2.5 md:py-3 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl md:rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: '전체보기', icon: Filter },
              { id: 'iphone', label: '아이폰', icon: Smartphone },
              { id: 'google', label: '구글', icon: Chrome },
              { id: 'naver', label: '네이버', icon: Globe },
              { id: 'favorites', label: '즐겨찾기', icon: Star },
              { id: 'emergency', label: '긴급', icon: ShieldAlert }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filter === btn.id 
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <btn.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${filter === btn.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contacts List Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
              className={`phone-book-item-card w-full transition-all group relative cursor-pointer tactile-card gradient-border-item light-glow ${
                expandedId === contact.id 
                  ? 'ring-4 ring-emerald-500/20 z-10 md:col-span-2 lg:col-span-2 xl:col-span-2 rounded-2xl p-4 md:p-6 border-none scale-[1.02]' 
                  : 'rounded-xl p-3.5 md:p-4 border-none'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm border transition-all ${
                    expandedId === contact.id 
                      ? 'w-12 h-12 md:w-16 md:h-16 text-lg md:text-2xl' 
                      : 'w-10 h-10 md:w-12 md:h-12 text-sm md:text-base'
                  } ${
                    contact.contactData?.isEmergency 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {((contact.contactData?.lastName || '') + (contact.contactData?.name || contact.title))[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate ${
                        expandedId === contact.id ? 'text-lg md:text-2xl' : 'text-sm md:text-base'
                      }`}>
                        {contact.contactData 
                          ? `${contact.contactData.lastName || ''}${contact.contactData.name}` 
                          : contact.title}
                      </h3>
                      {contact.isFavorite && <Star className={`${expandedId === contact.id ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-amber-400 fill-current shrink-0`} />}
                      {expandedId === contact.id && contact.contactData?.source && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getSourceInfo(contact.contactData.source).color}`}>
                          {getSourceInfo(contact.contactData.source).label}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <a 
                        href={`tel:${contact.contactData?.phoneNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center gap-1.5 font-medium text-slate-500 hover:text-emerald-600 transition-colors truncate ${
                          expandedId === contact.id ? 'text-sm md:text-lg' : 'text-xs md:text-sm'
                        }`}
                      >
                        <Phone className={`${expandedId === contact.id ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-3.5 md:h-3.5'} text-emerald-500`} />
                        {contact.contactData?.phoneNumber}
                      </a>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedId === contact.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100">
                              {contact.contactData?.organization && (
                                <div className="flex items-center gap-2.5 text-xs md:text-sm font-medium text-slate-600">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Organization</div>
                                    {contact.contactData.organization}
                                  </div>
                                </div>
                              )}
                              {contact.contactData?.email && (
                                <div className="flex items-center gap-2.5 text-xs md:text-sm font-medium text-slate-600">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Email</div>
                                    {contact.contactData.email}
                                  </div>
                                </div>
                              )}
                              {contact.contactData?.address && (
                                <div className="flex items-center gap-2.5 text-xs md:text-sm font-medium text-slate-600 sm:col-span-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Address</div>
                                    {contact.contactData.address}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2 sm:col-span-2 mt-2">
                                {contact.contactData?.birthday && (
                                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-bold border border-emerald-100 flex items-center gap-2">
                                    <Cake className="w-3 h-3" />
                                    {contact.contactData.birthday}
                                  </div>
                                )}
                                {contact.contactData?.website && (
                                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold border border-blue-100 flex items-center gap-2">
                                    <Globe2 className="w-3 h-3" />
                                    {contact.contactData.website}
                                  </div>
                                )}
                                {contact.contactData?.relationship && (
                                  <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-[10px] md:text-xs font-bold border border-purple-100 flex items-center gap-2">
                                    <UserPlus className="w-3 h-3" />
                                    {contact.contactData.relationship}
                                  </div>
                                )}
                              </div>

                              {contact.contactData?.customFields && contact.contactData.customFields.length > 0 && (
                                <div className="sm:col-span-2 space-y-2 mt-2">
                                  {contact.contactData.customFields.map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                      <div className="text-[10px] font-black text-slate-400 w-16 uppercase">{field.label}</div>
                                      <div className="text-xs md:text-sm font-bold text-slate-700">{field.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {contact.notes && (
                                <div className="sm:col-span-2 mt-2 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs md:text-sm text-slate-600">
                                  <div className="flex items-center gap-2 mb-2 text-amber-700">
                                    <StickyNote className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase">Private Note</span>
                                  </div>
                                  <div className="whitespace-pre-wrap italic leading-relaxed">
                                    {contact.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <div className={`flex items-center gap-1 transition-all ${expandedId === contact.id ? 'flex-col opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(contact.id); }}
                      title="즐겨찾기 토글"
                      className={`p-1.5 rounded-lg transition-colors ${contact.isFavorite ? 'bg-amber-50 text-amber-500 shadow-sm border border-amber-100' : 'bg-slate-50 text-slate-400 hover:text-amber-500'} cursor-pointer`}
                    >
                      <Star className={`${expandedId === contact.id ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-3 h-3'} `} fill={contact.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    
                    {expandedId === contact.id ? (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (contact.contactData?.phoneNumber) {
                              navigator.clipboard.writeText(contact.contactData.phoneNumber);
                              alert('전화번호가 복사되었습니다.');
                            }
                          }}
                          title="전화번호 복사"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedQrContact(contact); }}
                          title="QR 코드로 공유"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditItem(contact); }}
                          title="수정"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteItem(contact.id); }}
                          title="삭제"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditItem(contact); }}
                        title="수정"
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Expand Indicator */}
                  <div className={`mt-auto flex justify-center py-1 transition-transform duration-300 ${expandedId === contact.id ? 'rotate-180 text-emerald-600' : 'text-slate-300'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-100">
                  {contact.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] md:text-[10px] font-bold border border-slate-100">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {contacts.length === 0 && (
          <div className="col-span-full py-12 md:py-20 bg-white border border-dashed border-slate-300 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-4">
              <Phone className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900">연락처를 찾을 수 없습니다</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs">
              검색어를 변경하거나 새로운 보안 연락처를 추가해보세요.
            </p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
          >
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Upload className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">연락처 가져오기</h2>
                  <p className="hidden xs:block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Import Contacts</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImporting(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
              {/* File Selection */}
              <div>
                <label className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  연락처 파일 업로드
                </label>
                
                <label className="relative flex flex-col items-center justify-center gap-4 md:gap-5 p-6 md:p-12 border-2 border-dashed border-slate-200 rounded-[1.5rem] md:rounded-[2rem] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group bg-slate-50/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white border border-slate-200 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <FileSpreadsheet className="w-7 h-7 md:w-10 md:h-10 text-emerald-600" />
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                      <Upload className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  </div>

                  <div className="relative text-center">
                    <span className="block text-sm md:text-lg font-black text-slate-900">파일을 업로드하세요</span>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-black text-slate-500">CSV</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-black text-slate-500">VCF</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-black text-slate-500">JSON</span>
                    </div>
                  </div>

                  <div className="relative mt-2 px-5 py-2 md:py-2.5 bg-emerald-600 text-white text-xs md:text-sm font-black rounded-xl shadow-lg shadow-emerald-200 group-hover:bg-emerald-700 transition-colors">
                    파일 선택하기
                  </div>

                  <input 
                    type="file" 
                    accept=".json,.csv,.vcf"
                    onChange={handleFileImport}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Tips Section */}
              <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-slate-900">보안 안내</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium mt-1">
                    불러온 데이터는 AES-256으로 암호화되어 브라우저에만 저장됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-4 md:py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                onClick={() => setIsImporting(false)}
                className="px-6 py-2 text-sm font-black text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Code Sharing Modal */}
      {selectedQrContact && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <QrCode className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-slate-900">QR 코드로 공유</h2>
              </div>
              <button 
                onClick={() => setSelectedQrContact(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-inner">
                <QRCodeSVG 
                  value={generateVCard(selectedQrContact)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedQrContact.contactData?.lastName || ''}{selectedQrContact.contactData?.name}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  다른 기기에서 QR 코드를 스캔하여<br />연락처를 바로 추가할 수 있습니다.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Source</div>
                  <div className="text-xs font-bold text-slate-700">vCard Standard</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</div>
                  <div className="text-xs font-bold text-emerald-600">Secure Share</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setSelectedQrContact(null)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
