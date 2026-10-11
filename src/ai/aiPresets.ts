/**
 * aiPresets.ts
 * Đề mẫu hình học THCS đi kèm bản dựng sẵn, không cần gọi AI.
 */

export interface GeometryProblemPreset {
  id: string;
  grade: 'Toán 6' | 'Toán 7' | 'Toán 8' | 'Toán 9';
  title: string;
  topic: string;
  prompt: string;
}

export const AI_GEOMETRY_PRESETS: GeometryProblemPreset[] = [
  {
    id: 'preset-1',
    grade: 'Toán 7',
    title: '1. Tam giác & Đường cao AH',
    topic: 'Tam giác nhọn',
    prompt: 'Cho tam giác ABC nhọn. Kẻ đường cao AH từ đỉnh A xuống cạnh BC (H thuộc BC).',
  },
  {
    id: 'preset-2',
    grade: 'Toán 7',
    title: '2. Tam giác & Trung tuyến AM',
    topic: 'Trung tuyến',
    prompt: 'Cho tam giác ABC. Gọi M là trung điểm của cạnh BC, kẻ đường trung tuyến AM.',
  },
  {
    id: 'preset-3',
    grade: 'Toán 7',
    title: '3. Tam giác & Phân giác AD',
    topic: 'Đường phân giác',
    prompt: 'Cho tam giác ABC. Kẻ tia phân giác AD của góc A (D nằm trên cạnh BC).',
  },
  {
    id: 'preset-4',
    grade: 'Toán 7',
    title: '4. Tam giác cân & Các đường đặc biệt',
    topic: 'Tam giác cân',
    prompt: 'Cho tam giác ABC cân tại A. Kẻ đường cao AH, trung tuyến AM và đường phân giác AD xuống đáy BC.',
  },
  {
    id: 'preset-5',
    grade: 'Toán 8',
    title: '5. Tam giác vuông & Đường cao ứng với cạnh huyền',
    topic: 'Hệ thức lượng / Tam giác vuông',
    prompt: 'Cho tam giác ABC vuông tại A. Hạ đường cao AH vuông góc với cạnh huyền BC tại H.',
  },
  {
    id: 'preset-6',
    grade: 'Toán 8',
    title: '6. Tứ giác & Hai đường chéo',
    topic: 'Tứ giác lồi',
    prompt: 'Cho tứ giác ABCD. Kẻ hai đường chéo AC và BD cắt nhau tại điểm O.',
  },
  {
    id: 'preset-7',
    grade: 'Toán 8',
    title: '7. Hình thang & Hai đường chéo',
    topic: 'Hình thang (AB // CD)',
    prompt: 'Cho hình thang ABCD có đáy AB song song với CD. Kẻ hai đường chéo AC và BD cắt nhau tại O.',
  },
  {
    id: 'preset-8',
    grade: 'Toán 9',
    title: '8. Đường tròn & Dây cung vuông góc',
    topic: 'Quan hệ đường kính và dây cung',
    prompt: 'Cho đường tròn (O) bán kính R và dây cung CD. Kẻ đoạn thẳng OH vuông góc với CD tại trung điểm H của CD.',
  },
  {
    id: 'preset-9',
    grade: 'Toán 9',
    title: '9. Đường tròn & Tiếp tuyến tại một điểm',
    topic: 'Tiếp tuyến đường tròn',
    prompt: 'Cho đường tròn tâm O bán kính 3 cm. Lấy điểm A trên đường tròn, kẻ tiếp tuyến Ax với đường tròn tại tiếp điểm A.',
  },
  {
    id: 'preset-10',
    grade: 'Toán 7',
    title: '10. Hai đường song song & Cát tuyến',
    topic: 'Góc so le trong / Đồng vị',
    prompt: 'Cho hai đường thẳng a và b song song với nhau, bị cắt bởi đường thẳng c tại hai điểm A và B. Đánh dấu các cặp góc so le trong.',
  },
  {
    id: 'preset-11',
    grade: 'Toán 9',
    title: '11. Hai tiếp tuyến cắt nhau từ điểm ngoài',
    topic: 'Tính chất hai tiếp tuyến cắt nhau',
    prompt: 'Cho đường tròn tâm O. Từ điểm P nằm ngoài đường tròn, kẻ hai tiếp tuyến PA và PB tới đường tròn (A và B là hai tiếp điểm). Nối OP và dây cung AB.',
  },
  {
    id: 'preset-12',
    grade: 'Toán 8',
    title: '12. Hình chữ nhật & Hai đường chéo',
    topic: 'Hình chữ nhật',
    prompt: 'Cho hình chữ nhật ABCD có chiều dài AB và chiều rộng BC. Kẻ hai đường chéo AC và BD cắt nhau tại O.',
  },
  {
    id: 'preset-13',
    grade: 'Toán 8',
    title: '13. Định lý Ta-lét (Đường song song cắt 2 cạnh tam giác)',
    topic: 'Định lý Ta-lét trong tam giác',
    prompt: 'Cho tam giác ABC. Lấy điểm M trên cạnh AB, qua M kẻ đường thẳng song song với BC cắt AC tại N. Ký hiệu song song MN // BC.',
  },
  {
    id: 'preset-14',
    grade: 'Toán 8',
    title: '14. Đối xứng trục qua đường thẳng',
    topic: 'Phép đối xứng trục',
    prompt: 'Cho tam giác ABC và đường thẳng d. Dựng tam giác A\'B\'C\' đối xứng với tam giác ABC qua đường thẳng d, nối các đường dóng nét đứt vuông góc.',
  },
  {
    id: 'preset-15',
    grade: 'Toán 8',
    title: '15. Đối xứng tâm qua một điểm',
    topic: 'Phép đối xứng tâm',
    prompt: 'Cho đoạn thẳng AB và điểm I. Dựng đoạn thẳng A\'B\' đối xứng với đoạn thẳng AB qua tâm đối xứng I.',
  },
  {
    id: 'preset-16',
    grade: 'Toán 9',
    title: '16. Đa giác đều (Ngũ giác đều / Lục giác đều)',
    topic: 'Đa giác đều & Đường tròn ngoại tiếp',
    prompt: 'Dựng ngũ giác đều ABCDE nội tiếp đường tròn tâm O bán kính R, vẽ tâm O và các đoạn nối từ tâm đến các đỉnh.',
  },
];
