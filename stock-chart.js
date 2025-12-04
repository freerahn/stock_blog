// 주가 그래프 생성 함수 (순수 HTML용)
function createStockChart(containerId, stockSymbol, stockName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 로딩 표시
    container.innerHTML = '<div class="text-center py-8 text-gray-500">주가 데이터를 불러오는 중...</div>';

    let allStockData = [];
    let currentPeriod = '3m';
    let chartInstance = null;

    // 주가 데이터 가져오기
    getStockData(stockSymbol, '3y').then(data => {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">주가 데이터를 불러올 수 없습니다.</div>';
            return;
        }

        allStockData = data;
        renderChart();
    }).catch(error => {
        console.error('Error creating stock chart:', error);
        container.innerHTML = '<div class="text-center py-8 text-gray-500">주가 데이터를 불러오는 중 오류가 발생했습니다.</div>';
    });

    function renderChart() {
        const filteredData = filterDataByPeriod(allStockData, currentPeriod);

        if (filteredData.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">해당 기간의 데이터가 없습니다.</div>';
            return;
        }

        // 그래프 컨테이너 생성
        const periodButtons = `
            <div class="flex gap-2 mb-4 justify-center flex-wrap">
                <button onclick="updateChartPeriod('${containerId}', '1d')" 
                        class="period-btn px-4 py-2 rounded-lg text-sm font-medium transition ${currentPeriod === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                        data-period="1d">
                    1일
                </button>
                <button onclick="updateChartPeriod('${containerId}', '1w')" 
                        class="period-btn px-4 py-2 rounded-lg text-sm font-medium transition ${currentPeriod === '1w' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                        data-period="1w">
                    1주일
                </button>
                <button onclick="updateChartPeriod('${containerId}', '3m')" 
                        class="period-btn px-4 py-2 rounded-lg text-sm font-medium transition ${currentPeriod === '3m' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                        data-period="3m">
                    3개월
                </button>
                <button onclick="updateChartPeriod('${containerId}', '1y')" 
                        class="period-btn px-4 py-2 rounded-lg text-sm font-medium transition ${currentPeriod === '1y' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                        data-period="1y">
                    1년
                </button>
                <button onclick="updateChartPeriod('${containerId}', '3y')" 
                        class="period-btn px-4 py-2 rounded-lg text-sm font-medium transition ${currentPeriod === '3y' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                        data-period="3y">
                    3년
                </button>
            </div>
        `;

        container.innerHTML = `
            <div class="w-full mb-8">
                ${periodButtons}
                <div class="bg-white border border-gray-200 rounded-lg p-4" style="height: 400px;">
                    <canvas id="stock-chart-${stockSymbol}-${containerId}"></canvas>
                </div>
            </div>
        `;

        const canvas = document.getElementById(`stock-chart-${stockSymbol}-${containerId}`);
        if (!canvas || !window.Chart) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">차트를 불러올 수 없습니다.</div>';
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // 기존 차트가 있으면 제거
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // 날짜와 가격 배열 생성
        const labels = filteredData.map(point => formatChartDate(point.date, currentPeriod));
        const prices = filteredData.map(point => point.price);

        // Chart.js로 그래프 생성
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${stockName} 주가`,
                    data: prices,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `주가: ${context.parsed.y.toLocaleString()}원`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '주가 (원)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '원';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        // 차트 인스턴스 저장 (전역 스토리지에 저장)
        if (!window.stockCharts) {
            window.stockCharts = {};
        }
        window.stockCharts[containerId] = {
            instance: chartInstance,
            data: allStockData,
            symbol: stockSymbol,
            name: stockName,
            period: currentPeriod
        };
    }

    // 전역 업데이트 함수 등록
    if (!window.updateChartPeriod) {
        window.updateChartPeriod = function(containerId, period) {
            const chartData = window.stockCharts[containerId];
            if (!chartData) return;

            chartData.period = period;
            const filteredData = filterDataByPeriod(chartData.data, period);

            if (filteredData.length === 0) return;

            // 버튼 스타일 업데이트
            const container = document.getElementById(containerId);
            if (container) {
                const buttons = container.querySelectorAll('.period-btn');
                buttons.forEach(btn => {
                    if (btn.getAttribute('data-period') === period) {
                        btn.className = 'period-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-blue-600 text-white';
                    } else {
                        btn.className = 'period-btn px-4 py-2 rounded-lg text-sm font-medium transition bg-gray-200 text-gray-700 hover:bg-gray-300';
                    }
                });
            }

            // 차트 데이터 업데이트
            const labels = filteredData.map(point => formatChartDate(point.date, period));
            const prices = filteredData.map(point => point.price);

            chartData.instance.data.labels = labels;
            chartData.instance.data.datasets[0].data = prices;
            chartData.instance.update();
        };
    }
}

// 기간별 데이터 필터링
function filterDataByPeriod(data, period) {
    if (!data || data.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    switch (period) {
        case '1d':
            // 최근 1일 (당일)
            startDate = new Date(today);
            break;
        case '1w':
            // 최근 1주일
            startDate.setDate(today.getDate() - 7);
            break;
        case '3m':
            // 최근 3개월
            startDate.setMonth(today.getMonth() - 3);
            break;
        case '1y':
            // 최근 1년
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case '3y':
            // 최근 3년
            startDate.setFullYear(today.getFullYear() - 3);
            break;
    }

    startDate.setHours(0, 0, 0, 0);

    return data.filter(point => {
        const pointDate = new Date(point.date);
        pointDate.setHours(0, 0, 0, 0);
        return pointDate >= startDate && pointDate <= today;
    });
}

// 주가 데이터 가져오기 함수
async function getStockData(stockSymbol, range = '3y') {
    // 실제 API 연동 전까지 시뮬레이션 데이터 사용
    try {
        // Yahoo Finance API를 통한 주가 데이터 가져오기 시도
        const apiRange = range === '3y' ? '3y' : '3mo';
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}.KS?interval=1d&range=${apiRange}`
        );
        
        if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                return timestamps.map((timestamp, index) => ({
                    date: new Date(timestamp * 1000).toISOString().split('T')[0],
                    price: Math.round(closes[index] || 0)
                })).filter(point => point.price > 0);
            }
        }
    } catch (error) {
        console.warn('Yahoo Finance API 실패, 시뮬레이션 데이터 사용:', error);
    }

    // API 실패 시 시뮬레이션 데이터 생성
    return generateSimulatedStockData(stockSymbol, range);
}

// 시뮬레이션 주가 데이터 생성
function generateSimulatedStockData(stockSymbol, range = '3y') {
    const data = [];
    const today = new Date();
    const startDate = new Date(today);

    if (range === '3y') {
        startDate.setFullYear(today.getFullYear() - 3);
    } else {
        startDate.setMonth(today.getMonth() - 3);
    }

    // 종목 코드에 따른 기본 주가 설정
    const basePrices = {
        '079160': 6000, // CJ CGV
        '084990': 5000, // 헬릭스미스
        '035720': 4000, // 카티스
    };

    const basePrice = basePrices[stockSymbol] || 5000;
    let currentPrice = basePrice;

    // 기간 동안의 일별 데이터 생성
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        // 주말 제외
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        // 랜덤 변동 (-3% ~ +3%)
        const changePercent = (Math.random() - 0.5) * 6;
        currentPrice = currentPrice * (1 + changePercent / 100);

        // 주가가 너무 낮아지지 않도록 제한
        if (currentPrice < basePrice * 0.5) {
            currentPrice = basePrice * 0.5;
        }

        data.push({
            date: d.toISOString().split('T')[0],
            price: Math.round(currentPrice)
        });
    }

    return data;
}

// 날짜 포맷팅 함수 (차트용)
function formatChartDate(dateString, period) {
    const date = new Date(dateString);
    
    if (period === '1d') {
        // 1일: 시간까지 표시
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } else if (period === '1w' || period === '3m' || period === '1y') {
        // 1주일, 3개월, 1년: 월/일
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    } else {
        // 3년: 년/월
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}/${month}`;
    }
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
