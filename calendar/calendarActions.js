const checkValidMonthYear = function(month, year){
    if (month && year){
        try{
            let m = parseInt(month);
            let y = parseInt(year);
            if (m < 1 || m > 12){
                console.log(`Invalid month: ${m}`)
                return false;
            }
            if (y < 2000 || y > 2500) {
                console.log(`Invalid year: ${year}`)
                return false;
            }
            return true;
        }catch(err){
            console.log(`Wrong input month: ${month}  year: ${year}`)
            return false;
        }
    }else{
        console.log(`Wrong input month: ${month}  year: ${year}`)
        return false;
    }
}

module.exports = {
    checkValidMonthYear,
}