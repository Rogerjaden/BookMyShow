package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.ShowSeat;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShowSeatRepository extends JpaRepository<ShowSeat, Long> {

    List<ShowSeat> findByMovieShow_IdOrderBySeat_RowLabelAscSeat_SeatNumberAsc(
            Long movieShowId);

    List<ShowSeat> findByMovieShow_IdAndStatusOrderBySeat_RowLabelAscSeat_SeatNumberAsc(
            Long movieShowId, ShowSeatStatus status);

    boolean existsByMovieShow_IdAndSeat_Id(Long movieShowId, Long seatId);

    boolean existsByMovieShow_IdAndStatus(
            Long movieShowId, ShowSeatStatus status);

    List<ShowSeat> findByStatusAndLockedUntilBefore(
            ShowSeatStatus status, LocalDateTime time);

    List<ShowSeat> findByMovieShow_IdAndStatusAndLockedUntilBefore(
            Long movieShowId, ShowSeatStatus status, LocalDateTime time);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update ShowSeat ss
            set ss.status = :lockedStatus,
                ss.lockedUntil = :lockedUntil,
                ss.version = ss.version + 1
            where ss.id in :ids
              and ss.movieShow.id = :showId
              and (
                    ss.status = :availableStatus
                    or (
                        ss.status = :lockedStatus
                        and ss.lockedUntil is not null
                        and ss.lockedUntil <= :now
                    )
              )
            """)
    int claimAvailableSeats(
            @Param("ids") Collection<Long> ids,
            @Param("showId") Long showId,
            @Param("availableStatus") ShowSeatStatus availableStatus,
            @Param("lockedStatus") ShowSeatStatus lockedStatus,
            @Param("now") LocalDateTime now,
            @Param("lockedUntil") LocalDateTime lockedUntil
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ss from ShowSeat ss where ss.id = :id")
    Optional<ShowSeat> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ss from ShowSeat ss
            where ss.id in :ids
              and ss.movieShow.id = :showId
            order by ss.id
            """)
    List<ShowSeat> findAllByIdsForUpdate(
            @Param("ids") Collection<Long> ids,
            @Param("showId") Long showId
    );
}