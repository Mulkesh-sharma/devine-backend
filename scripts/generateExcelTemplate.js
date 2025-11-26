const XLSX = require('xlsx');
const path = require('path');

// Sample data for Excel template
const sampleData = [
    {
        'title': 'Ganesh Puja (Home)',
        'description': 'Simple Ganesh puja for auspicious beginnings - 30 minutes',
        'Duration (Minutes)': 30,
        'Duration': '30 minutes',
        'Price (INR)': 501,
        'Location': 'At Home',
        'Language': 'Hindi',
        'Category': 'Ganesh Pooja',
        'Difficulty': 'Easy',
        'Pandit Details': 'Experienced Vedic pandit with 10+ years',
        'benefits': 'Removes obstacles|Brings success|Mental peace',
        'materials': 'Ganesh idol|Flowers|Durva grass|Modak|Incense|Diya|Kumkum',
        'procedure': 'Sankalpa|Mantra chanting|Offering flowers|Aarti|Prasad',
        'included': 'Pandit|Materials|Video call guidance|Certificate',
        'excluded': 'Venue|Food|Transportation',
        'image': '/images/pooja/ganesh.jpg'
    },
    {
        'title': 'Satyanarayan Puja',
        'description': 'Family ritual for prosperity and blessings - 60 minutes',
        'Duration (Minutes)': 60,
        'Duration': '60 minutes',
        'Price (INR)': 1501,
        'Location': 'At Home',
        'Language': 'Hindi',
        'Category': 'Satyanarayan Katha',
        'Difficulty': 'Medium',
        'Pandit Details': 'Senior pandit specializing in Satyanarayan Katha',
        'benefits': 'Prosperity|Family harmony|Fulfills wishes|Protection',
        'materials': 'Idol|Panchamrit|Fruits|Banana leaves|Tulsi|Coconut|Kalash',
        'procedure': 'Kalash sthapana|Katha telling|Abhishek|Aarti|Prasad',
        'included': 'Materials|Pandit|Katha book|Prasad preparation',
        'excluded': 'Venue decoration|Guest food|Additional items',
        'image': '/images/pooja/satyanarayan.jpg'
    }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
const colWidths = [
    { wch: 25 }, // title
    { wch: 50 }, // description
    { wch: 15 }, // Duration (Minutes)
    { wch: 15 }, // Duration
    { wch: 12 }, // Price (INR)
    { wch: 15 }, // Location
    { wch: 15 }, // Language
    { wch: 20 }, // Category
    { wch: 12 }, // Difficulty
    { wch: 40 }, // Pandit Details
    { wch: 50 }, // benefits
    { wch: 50 }, // materials
    { wch: 50 }, // procedure
    { wch: 50 }, // included
    { wch: 50 }, // excluded
    { wch: 30 }  // image
];
ws['!cols'] = colWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Poojas');

// Write to file
const outputPath = path.join(__dirname, '..', '..', 'Devine', 'public', 'templates', 'pooja-template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Excel template created successfully at:', outputPath);
