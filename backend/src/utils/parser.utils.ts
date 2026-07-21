export class ParserUtils {
  /**
   * Classifies a document type based on raw text keywords.
   */
  public static classifyDocument(text: string): 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC' | 'UNKNOWN' {
    const uppercaseText = text.toUpperCase();

    // Aadhaar keywords
    if (
      uppercaseText.includes('UNIQUE IDENTIFICATION') ||
      uppercaseText.includes('AADHAAR') ||
      uppercaseText.includes('GOVERNMENT OF INDIA') && uppercaseText.includes('MALE') ||
      uppercaseText.includes('GOVERNMENT OF INDIA') && uppercaseText.includes('FEMALE') ||
      uppercaseText.includes('VID :') ||
      /(\b\d{4}\s\d{4}\s\d{4}\b)/.test(uppercaseText) && uppercaseText.includes('INDIA')
    ) {
      return 'AADHAAR';
    }

    // PAN Card keywords
    if (
      uppercaseText.includes('INCOME TAX DEPARTMENT') ||
      uppercaseText.includes('PERMANENT ACCOUNT CARD') ||
      uppercaseText.includes('PERMANENT ACCOUNT NUMBER') ||
      uppercaseText.includes('PAN CARD') ||
      /([A-Z]{5}[0-9]{4}[A-Z])/.test(uppercaseText)
    ) {
      return 'PAN';
    }

    // Driving License keywords
    if (
      uppercaseText.includes('DRIVING LICENCE') ||
      uppercaseText.includes('DRIVING LICENSE') ||
      uppercaseText.includes('UNION OF INDIA DRIVING') ||
      uppercaseText.includes('FORM 7') && uppercaseText.includes('LICENCE') ||
      uppercaseText.includes('TRANSPORT DEPARTMENT') && uppercaseText.includes('DL')
    ) {
      return 'DRIVING_LICENSE';
    }

    // Vehicle Registration Certificate keywords
    if (
      uppercaseText.includes('REGISTRATION CERTIFICATE') ||
      uppercaseText.includes('FORM 23') ||
      uppercaseText.includes('REGISTRATION NO') ||
      uppercaseText.includes('CHASSIS NO') ||
      uppercaseText.includes('ENGINE NO') ||
      uppercaseText.includes('OWNER NAME') ||
      uppercaseText.includes('VEHICLE REGISTRATION')
    ) {
      return 'VEHICLE_RC';
    }

    return 'UNKNOWN';
  }

  /**
   * Extracts data from Aadhaar text.
   */
  public static parseAadhaar(text: string): { data: Record<string, string> } {
    const data: Record<string, string> = {
      name: '',
      dob: '',
      gender: '',
      aadhaarNumber: '',
      address: '',
      pincode: '',
    };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Aadhaar Number
    // Standard: 12 digits, sometimes read with spaces or dashes
    const aadhaarMatch = text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/) || text.match(/\b\d{12}\b/);
    if (aadhaarMatch) {
      data.aadhaarNumber = aadhaarMatch[0].trim();
    }

    // 2. Date of Birth
    // Matches labels like DOB, D.O.B, Birth, Beth, Bith, Year of Birth
    const dobLineIndex = lines.findIndex(l => /dob|d\.o\.b|birth|beth|bith|birh|year/i.test(l));
    if (dobLineIndex !== -1) {
      const dobLine = lines[dobLineIndex];
      const stdDate = dobLine.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/);
      if (stdDate) {
        data.dob = this.normalizeDate(stdDate[0]);
      } else {
        // DDMM-YYYY or DDMM/YYYY support
        const altDate = dobLine.match(/\b(\d{2})(\d{2})[-\/](\d{4})\b/);
        if (altDate) {
          data.dob = `${altDate[1]}-${altDate[2]}-${altDate[3]}`;
        } else {
          // Just the 4-digit year (e.g. Year of Birth: 1995)
          const yearMatch = dobLine.match(/\b(19\d{2}|20\d{2})\b/);
          if (yearMatch) {
            data.dob = yearMatch[0];
          }
        }
      }

      // Aadhaar Name Heuristic: Name is typically printed on the line(s) directly above the DOB line
      if (dobLineIndex > 0) {
        let nameLine = '';
        for (let i = dobLineIndex - 1; i >= 0; i--) {
          const l = lines[i];
          // Skip header lines
          if (
            !l.toUpperCase().includes('GOVERNMENT') &&
            !l.toUpperCase().includes('INDIA') &&
            !l.toUpperCase().includes('UNIQUE') &&
            !l.toUpperCase().includes('AUTHORITY') &&
            !l.toUpperCase().includes('TO') &&
            !l.toUpperCase().includes('ENROLLMENT') &&
            !/\d/.test(l) && // Name shouldn't contain digits
            l.length > 3
          ) {
            nameLine = l;
            break;
          }
        }
        if (nameLine) {
          data.name = nameLine.replace(/^[^A-Za-z]+/, '').trim();
        }
      }
    }

    // General fallback for DOB
    if (!data.dob) {
      const dateMatch = text.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/);
      if (dateMatch) {
        data.dob = this.normalizeDate(dateMatch[0]);
      }
    }

    // 3. Gender
    // Case-insensitive match, correcting common OCR typos (like MAlE, MAIE)
    const genderMatch = text.match(/\b(MALE|FEMALE|TRANSGENDER|MAlE|MAIE|M\/F|FE-MALE)\b/i);
    if (genderMatch) {
      const genderVal = genderMatch[0].toUpperCase();
      if (genderVal.startsWith('M')) data.gender = 'MALE';
      else if (genderVal.startsWith('F')) data.gender = 'FEMALE';
      else data.gender = genderVal;
    }

    // 4. Pincode
    const pinMatch = text.match(/\b[1-9][0-9]{5}\b/);
    if (pinMatch) {
      data.pincode = pinMatch[0];
    }

    // 5. Address (heuristic search for Address: block)
    let addressStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      if (line.includes('ADDRESS') || line.includes('ADDRES:') || line.includes('ADRES:')) {
        addressStartIndex = i;
        break;
      }
    }

    if (addressStartIndex !== -1) {
      const addressLines: string[] = [];
      let rawAddr = lines[addressStartIndex];
      
      // Remove the label from first line
      const labelMatch = rawAddr.match(/address[:\s-]*/i);
      if (labelMatch) {
        rawAddr = rawAddr.substring(labelMatch[0].length);
      }
      if (rawAddr.trim()) {
        addressLines.push(rawAddr.trim());
      }

      // Fetch next lines until we hit pincode or other sections
      for (let i = addressStartIndex + 1; i < Math.min(lines.length, addressStartIndex + 5); i++) {
        const line = lines[i];
        if (line.toUpperCase().includes('HELP') || line.toUpperCase().includes('WWW.')) {
          break;
        }
        addressLines.push(line);
        if (data.pincode && line.includes(data.pincode)) {
          break;
        }
      }
      data.address = addressLines.join(', ').replace(/\s+/g, ' ').trim();
    } else {
      // Address Fallback: look for C/O, S/O, etc.
      let altAddrStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();
        if (line.includes('C/O') || line.includes('S/O') || line.includes('D/O') || line.includes('W/O') || line.includes('CIO ')) {
          altAddrStartIndex = i;
          break;
        }
      }
      if (altAddrStartIndex !== -1) {
        const addressLines: string[] = [];
        for (let i = altAddrStartIndex; i < Math.min(lines.length, altAddrStartIndex + 4); i++) {
          addressLines.push(lines[i]);
          if (data.pincode && lines[i].includes(data.pincode)) {
            break;
          }
        }
        data.address = addressLines.join(', ').replace(/\s+/g, ' ').trim();
      }
    }

    return { data };
  }

  /**
   * Extracts data from PAN text.
   */
  public static parsePan(text: string): { data: Record<string, string> } {
    const data: Record<string, string> = {
      name: '',
      fatherName: '',
      dob: '',
      panNumber: '',
    };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. PAN Number
    // Pattern: 5 letters, 4 numbers, 1 letter. Sometimes spaces get read.
    const cleanText = text.replace(/\s+/g, '');
    const panMatch = cleanText.match(/[A-Z]{5}[0-9]{4}[A-Z]/i);
    if (panMatch) {
      data.panNumber = panMatch[0].toUpperCase();
    } else {
      // Weak fallback
      const fallbackMatch = text.match(/[A-Z0-9]{10}/i);
      if (fallbackMatch) {
        data.panNumber = fallbackMatch[0].toUpperCase();
      }
    }

    // 2. Date of Birth
    const dobMatch = text.match(/\b\d{2}[/\-]\d{2}[/\-]\d{4}\b/);
    if (dobMatch) {
      data.dob = this.normalizeDate(dobMatch[0]);
    } else {
      // Try DDMM-YYYY or similar
      const altDate = text.match(/\b(\d{2})(\d{2})[-\/](\d{4})\b/);
      if (altDate) {
        data.dob = `${altDate[1]}-${altDate[2]}-${altDate[3]}`;
      }
    }

    // 3. Name & Father's Name Heuristic
    // On PAN cards, DOB index indicates lines above it are Name and Father's Name
    const dobIdx = lines.findIndex(l => l.includes(data.dob) || /dob|birth|date/i.test(l));
    const panIdx = lines.findIndex(l => l.toUpperCase().includes(data.panNumber || '____'));
    let targetIdx = dobIdx !== -1 ? dobIdx : (panIdx !== -1 ? panIdx : lines.length);

    const nameCandidates: string[] = [];
    for (let i = 0; i < targetIdx; i++) {
      const line = lines[i];
      if (
        !line.toUpperCase().includes('INCOME') &&
        !line.toUpperCase().includes('TAX') &&
        !line.toUpperCase().includes('DEPARTMENT') &&
        !line.toUpperCase().includes('GOVT') &&
        !line.toUpperCase().includes('INDIA') &&
        !line.toUpperCase().includes('CARD') &&
        !line.toUpperCase().includes('PERMANENT') &&
        !line.toUpperCase().includes('ACCOUNT') &&
        !/\d/.test(line) && // names do not contain numbers
        line.length > 3
      ) {
        nameCandidates.push(line.replace(/^[^A-Za-z]+/, '').trim());
      }
    }

    if (nameCandidates.length >= 2) {
      data.name = nameCandidates[nameCandidates.length - 2];
      data.fatherName = nameCandidates[nameCandidates.length - 1];
    } else if (nameCandidates.length === 1) {
      data.name = nameCandidates[0];
    }

    return { data };
  }

  /**
   * Extracts data from Driving License text.
   */
  public static parseDrivingLicense(text: string): { data: Record<string, string> } {
    const data: Record<string, string> = {
      name: '',
      dob: '',
      licenseNumber: '',
      expiryDate: '',
      address: '',
      pincode: '',
    };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. License Number
    // Matches State code + alphanumeric segments (cleans spaces, replaces typos like +)
    const dlMatch = text.match(/\b(AP|AR|AS|BR|CG|GA|GJ|HR|HP|JK|JH|KA|KL|MP|MH|MN|ML|MZ|NL|OD|OR|PB|RJ|SK|TN|TS|TR|UA|UK|UP|WB|AN|CH|DH|DD|DL|LD|PY)[-\s\+\d\w]{9,18}\b/i);
    if (dlMatch) {
      let rawDl = dlMatch[0].toUpperCase();
      rawDl = rawDl.replace(/\+/g, '1');
      rawDl = rawDl.replace(/[^A-Z0-9-]/g, '');
      data.licenseNumber = rawDl;
    } else {
      const weakMatch = text.match(/LICENCE\s*NO[.:\-\s]+([A-Z0-9-\s\+]{10,20})/i);
      if (weakMatch) {
        data.licenseNumber = weakMatch[1].trim().replace(/\+/g, '1').replace(/[^A-Z0-9-]/g, '');
      }
    }

    // 2. Date of Birth
    const dobLineIndex = lines.findIndex(l => /dob|d\.o\.b|birth|beth|bith|birh|date\s+of/i.test(l));
    if (dobLineIndex !== -1) {
      const dobLine = lines[dobLineIndex];
      const stdDate = dobLine.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/);
      if (stdDate) {
        data.dob = this.normalizeDate(stdDate[0]);
      } else {
        const altDate = dobLine.match(/\b(\d{2})(\d{2})[-\/](\d{4})\b/);
        if (altDate) {
          data.dob = `${altDate[1]}-${altDate[2]}-${altDate[3]}`;
        } else {
          const rawDate = dobLine.match(/\b\d{8}\b/);
          if (rawDate) {
            data.dob = `${rawDate[0].substring(0, 2)}-${rawDate[0].substring(2, 4)}-${rawDate[0].substring(4)}`;
          }
        }
      }

      // Name Heuristic: line above DOB line
      if (dobLineIndex > 0) {
        let nameLine = lines[dobLineIndex - 1];
        nameLine = nameLine.replace(/^[^A-Z]+/i, '');
        nameLine = nameLine.replace(/\b(NR|DL|COV|LMV|MCWG|RI|RL)\b/g, '');
        nameLine = nameLine.replace(/\s+/g, ' ').trim();
        if (nameLine.length > 3 && !/\d/.test(nameLine)) {
          data.name = nameLine;
        }
      }
    }

    // Fallback DOB
    if (!data.dob) {
      const dates = text.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/g) || [];
      for (const d of dates) {
        const norm = this.normalizeDate(d);
        const year = parseInt(norm.split('-')[2]);
        if (year && year < 2008) {
          data.dob = norm;
          break;
        }
      }
    }

    // 3. Expiry Date (parse future validity dates)
    const valLineIndex = lines.findIndex(l => /valid|val\b|exp\b|expiry|upto/i.test(l));
    if (valLineIndex !== -1) {
      const combinedText = lines.slice(valLineIndex, valLineIndex + 2).join(' ');
      const dateRegex = /\b(\d{2})[-\/]?(\d{2})[-\/](\d{4})\b/g;
      let match;
      const foundDates: string[] = [];
      while ((match = dateRegex.exec(combinedText)) !== null) {
        foundDates.push(`${match[1]}-${match[2]}-${match[3]}`);
      }

      const futureDates = foundDates.filter(d => {
        const year = parseInt(d.split('-')[2]);
        return year > 2024;
      });

      if (futureDates.length > 0) {
        futureDates.sort((a, b) => parseInt(b.split('-')[2]) - parseInt(a.split('-')[2]));
        data.expiryDate = futureDates[0];
      }
    }

    // 4. Pincode
    const pinMatch = text.match(/\b[1-9][0-9]{5}\b/);
    if (pinMatch) {
      data.pincode = pinMatch[0];
    }

    // 5. Address Heuristics
    let addressStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      if (
        line.includes('C/O') ||
        line.includes('CIO') ||
        line.includes('C O') ||
        line.includes('S/O') ||
        line.includes('D/O') ||
        line.includes('W/O') ||
        line.includes('AT ') ||
        line.includes('PO ') ||
        line.includes('AT/PO')
      ) {
        addressStartIndex = i;
        break;
      }
    }

    if (addressStartIndex !== -1) {
      const addressLines: string[] = [];
      for (let i = addressStartIndex; i < Math.min(lines.length, addressStartIndex + 4); i++) {
        const line = lines[i];
        if (line.toUpperCase().includes('VALID') || line.toUpperCase().includes('COV:')) {
          break;
        }
        addressLines.push(line);
        if (data.pincode && line.includes(data.pincode)) {
          break;
        }
      }
      data.address = addressLines.join(', ').replace(/\s+/g, ' ').trim();
    }

    return { data };
  }

  /**
   * Extracts data from Vehicle Registration Certificate (RC) text.
   */
  public static parseVehicleRC(text: string): { data: Record<string, string> } {
    const data: Record<string, string> = {
      registrationNumber: '',
      ownerName: '',
      chassisNumber: '',
      engineNumber: '',
      vehicleModel: '',
      expiryDate: '',
    };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Registration Number (plate codes: AP39TV1234)
    const regMatch = text.match(/\b[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}\b/i) || text.match(/REGN\s*NO[.:\-\s]+([A-Z0-9\s]{8,12})/i);
    if (regMatch) {
      data.registrationNumber = regMatch[0].replace(/\s+/g, '').toUpperCase();
    } else {
      // Fallback: search lines for plate structures
      const plate = lines.find(l => /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i.test(l.replace(/\s+/g, '')));
      if (plate) {
        data.registrationNumber = plate.replace(/\s+/g, '').toUpperCase();
      }
    }

    // 2. Chassis Number (17-char VIN code)
    const chassisMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (chassisMatch) {
      data.chassisNumber = chassisMatch[0].trim().toUpperCase();
    } else {
      const lineMatch = text.match(/CHASSIS\s*NO[.:\-\s]+([A-Z0-9]{10,20})/i) || text.match(/CHAS\s*NO[.:\-\s]+([A-Z0-9]{10,20})/i);
      if (lineMatch) {
        data.chassisNumber = lineMatch[1].trim().toUpperCase();
      }
    }

    // 3. Engine Number
    const engineMatch = text.match(/ENGINE\s*NO[.:\-\s]+([A-Z0-9]{8,15})/i) || text.match(/\bENG\s*NO[.:\-\s]+([A-Z0-9]{8,15})/i);
    if (engineMatch) {
      data.engineNumber = engineMatch[1].trim().toUpperCase();
    }

    // 4. Owner Name
    const ownerLineIdx = lines.findIndex(l => /owner|name|r\.o\b/i.test(l) && !/chassis|engine|father|husband/i.test(l));
    if (ownerLineIdx !== -1) {
      let ownerLine = lines[ownerLineIdx];
      const match = ownerLine.match(/(?:owner\s*name|name|r\.o)[:\s-]*(.*)/i);
      if (match && match[1].trim().length > 3) {
        data.ownerName = match[1].trim();
      } else if (ownerLineIdx + 1 < lines.length) {
        // If label is on line alone, grab the next line
        const nextLine = lines[ownerLineIdx + 1];
        if (!/\d/.test(nextLine) && nextLine.length > 3) {
          data.ownerName = nextLine.trim();
        }
      }
    }

    // 5. Vehicle Model
    const modelLineIdx = lines.findIndex(l => /model|make|class|type/i.test(l));
    if (modelLineIdx !== -1) {
      let modelLine = lines[modelLineIdx];
      const match = modelLine.match(/(?:model|make|class|type)[:\s-]*(.*)/i);
      if (match && match[1].trim().length > 3) {
        data.vehicleModel = match[1].trim();
      }
    }

    // 6. Expiry Date
    const expiryMatch = text.match(/\b(VALID\s*UPTO|VAL\s*UPTO|EXPIRY|REGN\s*EXPIRY|VALIDITY)[:\-\s]*(\d{2}[/\-]\d{2}[/\-]\d{4})\b/i);
    if (expiryMatch) {
      data.expiryDate = this.normalizeDate(expiryMatch[2]);
    } else {
      // Search for any date in the future (e.g. > 2028)
      const dates = text.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/g) || [];
      const futureDates = dates.filter(d => {
        const year = parseInt(this.normalizeDate(d).split('-')[2]);
        return year > 2025;
      });
      if (futureDates.length > 0) {
        data.expiryDate = this.normalizeDate(futureDates[0]);
      }
    }

    return { data };
  }

  /**
   * Helper to normalize dates to DD-MM-YYYY standard.
   */
  public static normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    let normalized = dateStr.replace(/\//g, '-').trim();
    const parts = normalized.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return normalized;
  }
}
