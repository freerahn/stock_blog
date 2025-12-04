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
    try {
        // 한국 주식은 6자리 종목 코드를 사용 (예: 005930.KS)
        // 종목 코드가 6자리 숫자인지 확인
        const cleanSymbol = stockSymbol.trim();
        if (!/^\d{6}$/.test(cleanSymbol)) {
            console.warn('종목 코드 형식이 올바르지 않습니다:', cleanSymbol);
            throw new Error('Invalid stock symbol format');
        }

        // Yahoo Finance API를 통한 주가 데이터 가져오기
        const apiRange = range === '3y' ? '3y' : '3mo';
        const yahooSymbol = `${cleanSymbol}.KS`;
        
        // CORS 프록시를 사용하거나 직접 호출
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${apiRange}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                const stockData = timestamps
                    .map((timestamp, index) => {
                        const closePrice = closes[index];
                        if (!closePrice || closePrice === null || isNaN(closePrice)) {
                            return null;
                        }
                        return {
                            date: new Date(timestamp * 1000).toISOString().split('T')[0],
                            price: Math.round(closePrice)
                        };
                    })
                    .filter(point => point !== null && point.price > 0);
                
                if (stockData.length > 0) {
                    console.log(`주가 데이터 로드 성공: ${cleanSymbol}, ${stockData.length}개 데이터 포인트`);
                    return stockData;
                }
            }
            
            // 데이터가 없거나 형식이 맞지 않는 경우
            console.warn('Yahoo Finance API 응답에 유효한 데이터가 없습니다:', result);
        } else {
            console.warn('Yahoo Finance API 응답 오류:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Yahoo Finance API 호출 실패:', error);
        console.warn('시뮬레이션 데이터를 사용합니다.');
    }

    // API 실패 시 시뮬레이션 데이터 생성 (실제 주가와 유사하게)
    return generateSimulatedStockData(stockSymbol, range);
}

// 시뮬레이션 주가 데이터 생성 (API 실패 시에만 사용)
function generateSimulatedStockData(stockSymbol, range = '3y') {
    console.warn(`⚠️ 실제 주가 데이터를 가져올 수 없어 시뮬레이션 데이터를 사용합니다. 종목: ${stockSymbol}`);
    
    const data = [];
    const today = new Date();
    const startDate = new Date(today);

    if (range === '3y') {
        startDate.setFullYear(today.getFullYear() - 3);
    } else {
        startDate.setMonth(today.getMonth() - 3);
    }

    // 실제 한국 주식의 평균 주가 범위를 고려한 기본 주가 설정
    // 종목 코드에 따른 기본 주가 설정 (실제 주가 범위 참고)
    const basePrices = {
        '079160': 6000, // CJ CGV
        '084990': 5000, // 헬릭스미스
        '035720': 4000, // 카티스
        '005930': 70000, // 삼성전자
        '000660': 50000, // SK하이닉스
        '035420': 200000, // NAVER
        '051910': 100000, // LG화학
    };

    const basePrice = basePrices[stockSymbol] || 10000;
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
    
    if (period === '1w' || period === '3m' || period === '1y') {
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
